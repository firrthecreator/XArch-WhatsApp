/**
 * @file profile_renderer.cc
 * @brief This module provides a high performance renderer for user profile cards.
 * It leverages the Node API (Napi) to interface with the V8 JavaScript engine
 * and the Cairo graphics library for drawing the final image.
 *
 * The renderer handles image manipulation, text rendering, and custom icon drawing,
 * ensuring fast and accurate graphical output directly to a Node.js Buffer.
 */

#include <napi.h>
#include <cairo/cairo.h>
#include <string>
#include <vector>
#include <cmath>
#include <algorithm>
#include <iterator>

/**
 * @struct UserRole
 * @brief Represents a single role assigned to a user.
 * This structure holds the display name and the system identifier for the role.
 */
struct UserRole
{
    /** The display name of the role (e.g., 'Developer'). */
    std::string name;
    /** The system type identifier of the role (e.g., 'developer'). */
    std::string type;
};

/**
 * @struct UserProfileData
 * @brief Encapsulates all data required to render the user profile card.
 * This data is passed from JavaScript via the Napi interface.
 */
struct UserProfileData
{
    /** The user's displayed name, typically larger and prominent. */
    std::string displayName;
    /** The user's unique username or handle (e.g., '@username'). */
    std::string username;
    /** The local file path to the user's avatar image. */
    std::string avatarPath;
    /** The local file path to the user's banner image. */
    std::string bannerPath;
    /** The user's online status ('online', 'idle', 'dnd', 'offline'). */
    std::string status;
    /** A vector containing all roles assigned to the user. */
    std::vector<UserRole> roles;
};

/**
 * @brief Forward declaration for the stream writer callback.
 * This function writes the generated PNG data chunks into a standard C++ vector.
 * @param closure A pointer to the destination vector (`std::vector<unsigned char> *`).
 * @param data A pointer to the current block of PNG data.
 * @param length The size of the data block in bytes.
 * @returns CAIRO_STATUS_SUCCESS on success, CAIRO_STATUS_WRITE_ERROR on memory allocation failure.
 */
static cairo_status_t png_stream_writer(void *closure, const unsigned char *data, unsigned int length);

/**
 * @brief Draws an image surface within a target area using the 'cover' object fit method.
 * The image is scaled to completely cover the area while maintaining its aspect ratio.
 * Any parts of the image that fall outside the bounds are clipped.
 *
 * @param cr The Cairo drawing context.
 * @param img The Cairo image surface to draw.
 * @param x The top left x coordinate of the target area.
 * @param y The top left y coordinate of the target area.
 * @param w The width of the target area.
 * @param h The height of the target area.
 */
void drawImageWithCover(cairo_t *cr, cairo_surface_t *img, double x, double y, double w, double h)
{
    double img_w = cairo_image_surface_get_width(img);
    double img_h = cairo_image_surface_get_height(img);

    // Calculate the scale factor required to cover the area.
    double scale = std::max(w / img_w, h / img_h);
    double scaled_width = img_w * scale;
    double scaled_height = img_h * scale;

    // Calculate the offset to center the scaled image within the bounds.
    double offset_x = x - (scaled_width - w) / 2.0;
    double offset_y = y - (scaled_height - h) / 2.0;

    cairo_save(cr);
    cairo_rectangle(cr, x, y, w, h);
    cairo_clip(cr); // Clip the drawing area to the target rectangle.
    cairo_translate(cr, offset_x, offset_y);
    cairo_scale(cr, scale, scale);
    cairo_set_source_surface(cr, img, 0, 0);
    cairo_paint(cr);
    cairo_restore(cr);
}

/**
 * @brief Draws a custom icon representing a developer role.
 * The icon is designed to resemble code brackets and a slash symbol.
 *
 * @param cr The Cairo drawing context.
 * @param x The top left x coordinate of the icon area.
 * @param y The top left y coordinate of the icon area.
 * @param size The size of the icon (width and height).
 */
void drawDevIcon(cairo_t *cr, double x, double y, double size)
{
    cairo_save(cr);
    cairo_set_source_rgb(cr, 0xe0 / 255.0, 0xe1 / 255.0, 0xe5 / 255.0);
    cairo_set_line_width(cr, size * 0.125);
    cairo_set_line_cap(cr, CAIRO_LINE_CAP_ROUND);
    cairo_new_path(cr);
    double s = size / 24.0;
    // The central slash
    cairo_move_to(cr, x + 10 * s, y + 20 * s); cairo_line_to(cr, x + 14 * s, y + 4 * s);
    // The right brackets
    cairo_move_to(cr, x + 18 * s, y + 8 * s); cairo_line_to(cr, x + 22 * s, y + 12 * s); cairo_line_to(cr, x + 18 * s, y + 16 * s);
    // The left brackets
    cairo_move_to(cr, x + 6 * s, y + 16 * s); cairo_line_to(cr, x + 2 * s, y + 12 * s); cairo_line_to(cr, x + 6 * s, y + 8 * s);
    cairo_stroke(cr);
    cairo_restore(cr);
}

/**
 * @brief Draws a custom icon representing a moderator role.
 * The icon is a simple triangle shape often used to symbolize a shield or authority.
 *
 * @param cr The Cairo drawing context.
 * @param x The top left x coordinate of the icon area.
 * @param y The top left y coordinate of the icon area.
 * @param size The size of the icon.
 */
void drawModeratorIcon(cairo_t *cr, double x, double y, double size)
{
    cairo_save(cr);
    double s = size / 24.0;
    cairo_move_to(cr, x + 12 * s, y + 4 * s);
    cairo_line_to(cr, x + 20 * s, y + 20 * s);
    cairo_line_to(cr, x + 4 * s, y + 20 * s);
    cairo_close_path(cr);
    cairo_set_source_rgb(cr, 0x4a / 255.0, 0x90 / 255.0, 0xe2 / 255.0);
    cairo_fill(cr);
    cairo_restore(cr);
}

/**
 * @brief Draws a custom icon representing a premium role (a star shape).
 * This icon is a five pointed star filled with a golden color.
 *
 * @param cr The Cairo drawing context.
 * @param x The top left x coordinate of the icon area.
 * @param y The top left y coordinate of the icon area.
 * @param size The size of the icon.
 */
void drawPremiumIcon(cairo_t *cr, double x, double y, double size)
{
    cairo_save(cr);
    double s = size / 24.0;
    double radius_outer = 10 * s;
    double radius_inner = 4 * s;
    cairo_new_path(cr);
    // Drawing a five pointed star by alternating between an outer and inner radius
    for (int i = 0; i < 5; ++i)
    {
        double angle_outer = i * 2.0 * M_PI / 5.0 - M_PI / 2.0;
        double angle_inner = angle_outer + M_PI / 5.0;
        cairo_line_to(cr, x + 12 * s + cos(angle_outer) * radius_outer, y + 12 * s + sin(angle_outer) * radius_outer);
        cairo_line_to(cr, x + 12 * s + cos(angle_inner) * radius_inner, y + 12 * s + sin(angle_inner) * radius_inner);
    }
    cairo_close_path(cr);
    cairo_set_source_rgb(cr, 0xff / 255.0, 0xd7 / 255.0, 0.0);
    cairo_fill(cr);
    cairo_restore(cr);
}

/**
 * @brief Draws a path for a rectangle with rounded corners.
 * This function only defines the path and does not perform the fill or stroke operation.
 *
 * @param cr The Cairo drawing context.
 * @param x The top left x coordinate.
 * @param y The top left y coordinate.
 * @param width The width of the rectangle.
 * @param height The height of the rectangle.
 * @param radius The radius of the rounded corners.
 */
void drawRoundRect(cairo_t *cr, double x, double y, double width, double height, double radius)
{
    cairo_new_sub_path(cr);
    // Top right arc
    cairo_arc(cr, x + width - radius, y + radius, radius, -M_PI / 2, 0);
    // Bottom right arc
    cairo_arc(cr, x + width - radius, y + height - radius, radius, 0, M_PI / 2);
    // Bottom left arc
    cairo_arc(cr, x + radius, y + height - radius, radius, M_PI / 2, M_PI);
    // Top left arc
    cairo_arc(cr, x + radius, y + radius, radius, M_PI, 3 * M_PI / 2);
    cairo_close_path(cr);
}

/**
 * @brief The main Napi function to render the user profile card.
 * This function receives user data, draws the profile to a Cairo surface,
 * converts the surface to a PNG byte stream, and returns it as a Node.js Buffer.
 *
 * @param info The Napi callback information object containing arguments and environment.
 * @returns Napi::Value A Node.js Buffer containing the PNG image data, or null on error.
 */
Napi::Value RenderProfile(const Napi::CallbackInfo &info)
{
    Napi::Env env = info.Env();

    // 1. Argument Validation
    if (info.Length() < 1 || !info[0].IsObject())
    {
        Napi::Error::New(env, "Invalid argument: A user data object is required.").ThrowAsJavaScriptException();
        return env.Null();
    }

    Napi::Object input = info[0].As<Napi::Object>();
    UserProfileData data;

    // 2. Data Parsing and Conversion (JavaScript to C++)
    try
    {
        data.displayName = input.Get("displayName").As<Napi::String>().Utf8Value();
        data.username = input.Get("username").As<Napi::String>().Utf8Value();
        data.avatarPath = input.Get("avatarPath").As<Napi::String>().Utf8Value();
        data.bannerPath = input.Get("bannerPath").As<Napi::String>().Utf8Value();
        data.status = input.Get("status").As<Napi::String>().Utf8Value();

        // Parse roles array
        if (input.Has("roles") && input.Get("roles").IsArray())
        {
            Napi::Array rolesJs = input.Get("roles").As<Napi::Array>();
            for (uint32_t i = 0; i < rolesJs.Length(); ++i)
            {
                Napi::Object roleJs = rolesJs.Get(i).As<Napi::Object>();
                UserRole role;
                role.name = roleJs.Get("name").As<Napi::String>().Utf8Value();
                role.type = roleJs.Get("type").As<Napi::String>().Utf8Value();
                data.roles.push_back(role);
            }
        }
    }
    catch (const Napi::Error &e)
    {
        Napi::Error::New(env, "Failed to parse user data object: " + std::string(e.what())).ThrowAsJavaScriptException();
        return env.Null();
    }

    // 3. Canvas Setup
    const double scale = 4.0;
    const int canvasWidth = static_cast<int>(384 * scale);
    const int canvasHeight = static_cast<int>(246 * scale);

    cairo_surface_t *surface = cairo_image_surface_create(CAIRO_FORMAT_ARGB32, canvasWidth, canvasHeight);
    cairo_t *cr = cairo_create(surface);

    // Initial background paint
    cairo_set_source_rgb(cr, 0x2b / 255.0, 0x2d / 255.0, 0x31 / 255.0);
    cairo_paint(cr);

    // 4. Draw Banner Image
    cairo_surface_t *bannerImg = cairo_image_surface_create_from_png(data.bannerPath.c_str());
    if (cairo_surface_status(bannerImg) == CAIRO_STATUS_SUCCESS)
    {
        drawImageWithCover(cr, bannerImg, 0, 0, canvasWidth, 128 * scale);
    }
    // Clean up banner surface regardless of load status
    cairo_surface_destroy(bannerImg);

    // 5. Draw Avatar Image (Clipped to a Circle)
    const double avatarSize = 96 * scale;
    const double avatarX = 16 * scale;
    const double avatarY = 80 * scale;
    cairo_surface_t *avatarImg = cairo_image_surface_create_from_png(data.avatarPath.c_str());
    if (cairo_surface_status(avatarImg) == CAIRO_STATUS_SUCCESS)
    {
        cairo_save(cr);
        // Define a circular clipping path
        cairo_arc(cr, avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, 2 * M_PI);
        cairo_clip(cr);
        // Draw the image using the cover method
        drawImageWithCover(cr, avatarImg, avatarX, avatarY, avatarSize, avatarSize);
        cairo_restore(cr);
    }
    cairo_surface_destroy(avatarImg);

    // Draw Avatar Border
    cairo_set_source_rgb(cr, 0x2b / 255.0, 0x2d / 255.0, 0x31 / 255.0);
    cairo_set_line_width(cr, 6 * scale);
    cairo_arc(cr, avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, 2 * M_PI);
    cairo_stroke(cr);

    // 6. Draw Status Indicator
    const double statusIndicatorSize = 32 * scale;
    const double statusIndicatorX = avatarX + avatarSize - statusIndicatorSize * 0.85;
    const double statusIndicatorY = avatarY + avatarSize - statusIndicatorSize * 0.85;

    // Set color based on the status string
    if (data.status == "online") cairo_set_source_rgb(cr, 0x23 / 255.0, 0xa5 / 255.0, 0x5a / 255.0);
    else if (data.status == "idle") cairo_set_source_rgb(cr, 0xf0 / 255.0, 0xb2 / 255.0, 0x32 / 255.0);
    else if (data.status == "dnd") cairo_set_source_rgb(cr, 0xf2 / 255.0, 0x3f / 255.0, 0x43 / 255.0);
    else cairo_set_source_rgb(cr, 0x80 / 255.0, 0x84 / 255.0, 0x8e / 255.0);

    cairo_arc(cr, statusIndicatorX + statusIndicatorSize / 2, statusIndicatorY + statusIndicatorSize / 2, statusIndicatorSize / 2.5, 0, 2 * M_PI);
    cairo_fill(cr);

    // 7. Draw Roles and Icons
    const double roleStartY = (128 + 16) * scale;
    const double roleGap = 8 * scale;
    const double roleHeight = 28 * scale;
    for (size_t i = 0; i < data.roles.size(); ++i)
    {
        double roleBgWidth = 110 * scale;
        double roleBgX = canvasWidth - roleBgWidth - 16 * scale;
        double roleBgY = roleStartY + i * (roleHeight + roleGap);

        // Draw role background rectangle
        cairo_set_source_rgba(cr, 0x36 / 255.0, 0x37 / 255.0, 0x3d / 255.0, 0.8);
        drawRoundRect(cr, roleBgX, roleBgY, roleBgWidth, roleHeight, 8 * scale);
        cairo_fill(cr);

        // Draw role icon based on type
        if (data.roles[i].type == "developer") drawDevIcon(cr, roleBgX + 8 * scale, roleBgY + 6 * scale, 16 * scale);
        else if (data.roles[i].type == "moderator") drawModeratorIcon(cr, roleBgX + 8 * scale, roleBgY + 6 * scale, 16 * scale);
        else if (data.roles[i].type == "premium") drawPremiumIcon(cr, roleBgX + 8 * scale, roleBgY + 6 * scale, 16 * scale);

        // Draw role name text
        cairo_set_source_rgb(cr, 0xe0 / 255.0, 0xe1 / 255.0, 0xe5 / 255.0);
        cairo_select_font_face(cr, "Sans", CAIRO_FONT_SLANT_NORMAL, CAIRO_FONT_WEIGHT_BOLD);
        cairo_set_font_size(cr, 14 * scale);
        cairo_move_to(cr, roleBgX + 30 * scale, roleBgY + 19 * scale);
        cairo_show_text(cr, data.roles[i].name.c_str());
    }

    // 8. Draw Display Name and Username
    const double contentPaddingTop = 24 * scale;
    const double textX = 16 * scale;
    const double textY = avatarY + avatarSize + contentPaddingTop;

    // Draw Display Name
    cairo_set_source_rgb(cr, 1.0, 1.0, 1.0);
    cairo_select_font_face(cr, "Sans", CAIRO_FONT_SLANT_NORMAL, CAIRO_FONT_WEIGHT_BOLD);
    cairo_set_font_size(cr, 22 * scale);
    cairo_move_to(cr, textX, textY);
    cairo_show_text(cr, data.displayName.c_str());

    // Draw Username
    cairo_set_source_rgb(cr, 0xb5 / 255.0, 0xba / 255.0, 0xc1 / 255.0);
    cairo_select_font_face(cr, "Sans", CAIRO_FONT_SLANT_NORMAL, CAIRO_FONT_WEIGHT_NORMAL);
    cairo_set_font_size(cr, 14 * scale);
    cairo_move_to(cr, textX, textY + 28 * scale);
    std::string usernameText = "@" + data.username;
    cairo_show_text(cr, usernameText.c_str());

    // 9. Finalize and Export PNG
    std::vector<unsigned char> png_data;
    cairo_status_t status = cairo_surface_write_to_png_stream(surface, png_stream_writer, &png_data);

    // Clean up Cairo resources
    cairo_destroy(cr);
    cairo_surface_destroy(surface);

    if (status != CAIRO_STATUS_SUCCESS)
    {
        Napi::Error::New(env, "Failed to write Cairo surface to PNG stream.").ThrowAsJavaScriptException();
        return env.Null();
    }

    // 10. Return Buffer to JavaScript
    return Napi::Buffer<unsigned char>::Copy(env, png_data.data(), png_data.size());
}

/**
 * @brief The static callback function used by Cairo to write PNG data chunks.
 * It appends the data to a C++ vector that acts as the output stream buffer.
 *
 * @param closure A void pointer that points to the output vector (`std::vector<unsigned char> *`).
 * @param data A pointer to the current block of PNG data.
 * @param length The size of the data block in bytes.
 * @returns cairo_status_t Returns CAIRO_STATUS_SUCCESS or CAIRO_STATUS_WRITE_ERROR.
 */
static cairo_status_t png_stream_writer(void *closure, const unsigned char *data, unsigned int length)
{
    auto *png_vector = static_cast<std::vector<unsigned char> *>(closure);
    try
    {
        png_vector->insert(png_vector->end(), data, data + length);
    }
    catch (const std::bad_alloc &)
    {
        // Handle case where memory allocation fails
        return CAIRO_STATUS_WRITE_ERROR;
    }
    return CAIRO_STATUS_SUCCESS;
}

/**
 * @brief Napi initialization function.
 * This function is called when the Node.js module is imported. It registers the
 * C++ functions to be exposed to JavaScript.
 *
 * @param env The Napi environment.
 * @param exports The Napi object where module exports are set.
 * @returns Napi::Object The exports object.
 */
Napi::Object Init(Napi::Env env, Napi::Object exports)
{
    exports.Set("renderProfile", Napi::Function::New(env, RenderProfile));
    return exports;
}

/**
 * @brief Registers the module with Node.js.
 * This macro defines the entry point for the compiled addon.
 */
NODE_API_MODULE(profile_renderer, Init)
