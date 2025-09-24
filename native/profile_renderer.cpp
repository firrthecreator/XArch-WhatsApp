/**
 * @file profile_renderer.cpp
 * @description A Node.js addon for rendering a user profile card using the Cairo graphics library.
 * This file defines the data structures, drawing utility functions, and the main N API
 * export for generating a high quality user profile image.
 */

#include <napi.h>
#include <cairo/cairo.h>
#include <string>
#include <vector>
#include <cmath>
#include <algorithm> // For std::max

// Data Structures

/**
 * @struct UserRole
 * @description Holds information about a single user role, including its display name and a type
 * identifier used to select the correct icon.
 */
struct UserRole {
    std::string name;
    std::string type;
};

/**
 * @struct UserProfileData
 * @description A comprehensive structure that holds all the necessary data parsed from JavaScript
 * to render the user profile card.
 */
struct UserProfileData {
    std::string displayName;
    std::string username;
    std::string avatarPath;
    std::string bannerPath;
    std::string status;
    std::vector<UserRole> roles;
};

// Drawing Utility Functions

/**
 * @brief Draws an image onto the Cairo context, scaling it to cover the target area
 * while maintaining its aspect ratio.
 * @param cr The Cairo rendering context.
 * @param img The image surface to draw.
 * @param x The target x coordinate.
 * @param y The target y coordinate.
 * @param w The target width.
 * @param h The target height.
 */
void drawImageWithCover(cairo_t* cr, cairo_surface_t* img, double x, double y, double w, double h) {
    double img_w = cairo_image_surface_get_width(img);
    double img_h = cairo_image_surface_get_height(img);
    
    // Calculate the scale factor to cover the area, then find the new dimensions and offsets.
    double scale = std::max(w / img_w, h / img_h);
    double scaled_width = img_w * scale;
    double scaled_height = img_h * scale;
    double offset_x = x - (scaled_width - w) / 2.0;
    double offset_y = y - (scaled_height - h) / 2.0;

    cairo_save(cr);
    cairo_rectangle(cr, x, y, w, h); // Clip the drawing area
    cairo_clip(cr);
    cairo_translate(cr, offset_x, offset_y); // Position the image
    cairo_scale(cr, scale, scale);           // Scale the image
    cairo_set_source_surface(cr, img, 0, 0);
    cairo_paint(cr);
    cairo_restore(cr);
}

/**
 * @brief Draws a developer role icon.
 * @param cr The Cairo rendering context.
 * @param x The top left x coordinate for the icon's bounding box.
 * @param y The top left y coordinate for the icon's bounding box.
 * @param size The size of the icon's bounding box.
 */
void drawDevIcon(cairo_t* cr, double x, double y, double size) {
    cairo_save(cr);
    cairo_set_source_rgb(cr, 0xe0 / 255.0, 0xe1 / 255.0, 0xe5 / 255.0); // Light gray
    cairo_set_line_width(cr, size * 0.125);
    cairo_new_path(cr);
    double s = size / 24.0; // Scaler for coordinates
    cairo_move_to(cr, x + 10 * s, y + 20 * s); cairo_line_to(cr, x + 14 * s, y + 4 * s);
    cairo_move_to(cr, x + 18 * s, y + 8 * s); cairo_line_to(cr, x + 22 * s, y + 12 * s); cairo_line_to(cr, x + 18 * s, y + 16 * s);
    cairo_move_to(cr, x + 6 * s, y + 16 * s); cairo_line_to(cr, x + 2 * s, y + 12 * s); cairo_line_to(cr, x + 6 * s, y + 8 * s);
    cairo_stroke(cr);
    cairo_restore(cr);
}

/**
 * @brief Draws a moderator role icon.
 * @param cr The Cairo rendering context.
 * @param x The top left x coordinate for the icon's bounding box.
 * @param y The top left y coordinate for the icon's bounding box.
 * @param size The size of the icon's bounding box.
 */
void drawModeratorIcon(cairo_t* cr, double x, double y, double size) {
    cairo_save(cr);
    double s = size / 24.0;
    cairo_move_to(cr, x + 12 * s, y + 4 * s);
    cairo_line_to(cr, x + 20 * s, y + 20 * s);
    cairo_line_to(cr, x + 4 * s, y + 20 * s);
    cairo_close_path(cr);
    cairo_set_source_rgb(cr, 0x4a / 255.0, 0x90 / 255.0, 0xe2 / 255.0); // Blue
    cairo_fill(cr);
    cairo_restore(cr);
}

/**
 * @brief Draws a premium role icon (a star).
 * @param cr The Cairo rendering context.
 * @param x The top left x coordinate for the icon's bounding box.
 * @param y The top left y coordinate for the icon's bounding box.
 * @param size The size of the icon's bounding box.
 */
void drawPremiumIcon(cairo_t* cr, double x, double y, double size) {
    cairo_save(cr);
    double s = size / 24.0;
    cairo_new_path(cr);
    for (int i = 0; i < 5; ++i) {
        double angle_outer = i * 2.0 * M_PI / 5.0 - M_PI / 2.0;
        double angle_inner = angle_outer + M_PI / 5.0;
        cairo_line_to(cr, x + 12 * s + cos(angle_outer) * 10 * s, y + 12 * s + sin(angle_outer) * 10 * s);
        cairo_line_to(cr, x + 12 * s + cos(angle_inner) * 4 * s, y + 12 * s + sin(angle_inner) * 4 * s);
    }
    cairo_close_path(cr);
    cairo_set_source_rgb(cr, 0xff / 255.0, 0xd7 / 255.0, 0.0); // Gold
    cairo_fill(cr);
    cairo_restore(cr);
}

/**
 * @brief Draws a rectangle with rounded corners.
 * @param cr The Cairo rendering context.
 * @param x The top left x coordinate.
 * @param y The top left y coordinate.
 * @param width The width of the rectangle.
 * @param height The height of the rectangle.
 * @param radius The corner radius.
 */
void drawRoundRect(cairo_t* cr, double x, double y, double width, double height, double radius) {
    cairo_new_path(cr);
    cairo_arc(cr, x + width - radius, y + radius, radius, -M_PI / 2, 0);
    cairo_arc(cr, x + width - radius, y + height - radius, radius, 0, M_PI / 2);
    cairo_arc(cr, x + radius, y + height - radius, radius, M_PI / 2, M_PI);
    cairo_arc(cr, x + radius, y + radius, radius, M_PI, 3 * M_PI / 2);
    cairo_close_path(cr);
}


// N API Exported Function

/**
 * @brief The main exported function for the N API addon. It parses user data from a JavaScript
 * object and orchestrates the drawing process to generate a profile card image.
 * @param info The N API callback info containing the arguments.
 * @return Napi::Value The filename of the generated PNG image, or null on error.
 */
Napi::Value RenderProfile(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    // 1. Argument Validation & Data Parsing
    if (info.Length() < 1 || !info[0].IsObject()) {
        Napi::Error::New(env, "Expects one argument: an object containing user data.").ThrowAsJavaScriptException();
        return env.Null();
    }

    Napi::Object input = info[0].As<Napi::Object>();
    UserProfileData data;
    data.displayName = input.Get("displayName").As<Napi::String>().Utf8Value();
    data.username = input.Get("username").As<Napi::String>().Utf8Value();
    data.avatarPath = input.Get("avatarPath").As<Napi::String>().Utf8Value();
    data.bannerPath = input.Get("bannerPath").As<Napi::String>().Utf8Value();
    data.status = input.Get("status").As<Napi::String>().Utf8Value();

    if (input.Has("roles") && input.Get("roles").IsArray()) {
        Napi::Array rolesJs = input.Get("roles").As<Napi::Array>();
        for (uint32_t i = 0; i < rolesJs.Length(); ++i) {
            Napi::Object roleJs = rolesJs.Get(i).As<Napi::Object>();
            UserRole role;
            role.name = roleJs.Get("name").As<Napi::String>().Utf8Value();
            role.type = roleJs.Get("type").As<Napi::String>().Utf8Value();
            data.roles.push_back(role);
        }
    }

    // 2. Canvas & Cairo Setup
    double scale = 4.0;
    int canvasWidth = static_cast<int>(384 * scale);
    int canvasHeight = static_cast<int>(246 * scale);

    cairo_surface_t* surface = cairo_image_surface_create(CAIRO_FORMAT_ARGB32, canvasWidth, canvasHeight);
    cairo_t* cr = cairo_create(surface);

    // 3. Drawing Operations

    // Draw background
    cairo_set_source_rgb(cr, 0x2b / 255.0, 0x2d / 255.0, 0x31 / 255.0); // Dark gray
    cairo_rectangle(cr, 0, 0, canvasWidth, canvasHeight);
    cairo_fill(cr);

    // Draw banner
    cairo_surface_t* bannerImg = cairo_image_surface_create_from_png(data.bannerPath.c_str());
    if (cairo_surface_status(bannerImg) == CAIRO_STATUS_SUCCESS) {
        drawImageWithCover(cr, bannerImg, 0, 0, canvasWidth, 128 * scale);
    } // No else needed; background is already drawn.
    cairo_surface_destroy(bannerImg);

    // Draw avatar
    double avatarSize = 96 * scale;
    double avatarX = 16 * scale;
    double avatarY = 80 * scale;
    cairo_surface_t* avatarImg = cairo_image_surface_create_from_png(data.avatarPath.c_str());
    if (cairo_surface_status(avatarImg) == CAIRO_STATUS_SUCCESS) {
        cairo_save(cr);
        cairo_arc(cr, avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, 2 * M_PI);
        cairo_clip(cr);
        drawImageWithCover(cr, avatarImg, avatarX, avatarY, avatarSize, avatarSize);
        cairo_restore(cr);
    } else { // Fallback if avatar fails to load
        cairo_save(cr);
        cairo_arc(cr, avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, 2 * M_PI);
        cairo_set_source_rgb(cr, 0x80 / 255.0, 0x84 / 255.0, 0x8e / 255.0); // Medium gray
        cairo_fill(cr);
        cairo_restore(cr);
    }
    cairo_surface_destroy(avatarImg);

    // Draw avatar border
    cairo_set_source_rgb(cr, 0x2b / 255.0, 0x2d / 255.0, 0x31 / 255.0);
    cairo_set_line_width(cr, 6 * scale);
    cairo_arc(cr, avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, 2 * M_PI);
    cairo_stroke(cr);

    // Draw status indicator
    double statusIndicatorSize = 32 * scale;
    double statusIndicatorX = avatarX + avatarSize - statusIndicatorSize * 0.85;
    double statusIndicatorY = avatarY + avatarSize - statusIndicatorSize * 0.85;

    if (data.status == "online") cairo_set_source_rgb(cr, 0x23/255.0, 0xa5/255.0, 0x5a/255.0); // Green
    else if (data.status == "idle") cairo_set_source_rgb(cr, 0xf0/255.0, 0xb2/255.0, 0x32/255.0); // Yellow
    else if (data.status == "dnd") cairo_set_source_rgb(cr, 0xf2/255.0, 0x3f/255.0, 0x43/255.0); // Red
    else cairo_set_source_rgb(cr, 0x80/255.0, 0x84/255.0, 0x8e/255.0); // Gray for offline/unknown
    
    cairo_arc(cr, statusIndicatorX + statusIndicatorSize / 2, statusIndicatorY + statusIndicatorSize / 2, statusIndicatorSize / 2.5, 0, 2 * M_PI);
    cairo_fill(cr);

    // Draw roles
    double roleStartY = (128 + 16) * scale;
    double roleGap = 8 * scale;
    double roleHeight = 28 * scale;
    for (size_t i = 0; i < data.roles.size(); ++i) {
        double roleBgWidth = 110 * scale;
        double roleBgX = canvasWidth - roleBgWidth - 16 * scale;
        double roleBgY = roleStartY + i * (roleHeight + roleGap);

        cairo_set_source_rgb(cr, 0x36 / 255.0, 0x37 / 255.0, 0x3d / 255.0); // Role bg color
        drawRoundRect(cr, roleBgX, roleBgY, roleBgWidth, roleHeight, 8 * scale);
        cairo_fill(cr);

        // Draw the appropriate icon based on role type
        if (data.roles[i].type == "developer") drawDevIcon(cr, roleBgX + 8 * scale, roleBgY + 6 * scale, 16 * scale);
        else if (data.roles[i].type == "moderator") drawModeratorIcon(cr, roleBgX + 8 * scale, roleBgY + 6 * scale, 16 * scale);
        else if (data.roles[i].type == "premium") drawPremiumIcon(cr, roleBgX + 8 * scale, roleBgY + 6 * scale, 16 * scale);

        // Draw role name text
        cairo_set_source_rgb(cr, 0xe0 / 255.0, 0xe1 / 255.0, 0xe5 / 255.0); // Role text color
        cairo_select_font_face(cr, "Sans", CAIRO_FONT_SLANT_NORMAL, CAIRO_FONT_WEIGHT_BOLD);
        cairo_set_font_size(cr, 14 * scale);
        cairo_move_to(cr, roleBgX + 30 * scale, roleBgY + 19 * scale);
        cairo_show_text(cr, data.roles[i].name.c_str());
    }

    // Draw text (Display Name and Username)
    double contentPaddingTop = 24 * scale;
    double textX = 16 * scale;
    double textY = avatarY + avatarSize + contentPaddingTop;
    
    // Display Name
    cairo_set_source_rgb(cr, 1.0, 1.0, 1.0); // White
    cairo_select_font_face(cr, "Sans", CAIRO_FONT_SLANT_NORMAL, CAIRO_FONT_WEIGHT_BOLD);
    cairo_set_font_size(cr, 22 * scale);
    cairo_move_to(cr, textX, textY);
    cairo_show_text(cr, data.displayName.c_str());
    
    // Username
    cairo_set_source_rgb(cr, 0xb5 / 255.0, 0xba / 255.0, 0xc1 / 255.0); // Light gray
    cairo_select_font_face(cr, "Sans", CAIRO_FONT_SLANT_NORMAL, CAIRO_FONT_WEIGHT_NORMAL);
    cairo_set_font_size(cr, 14 * scale);
    cairo_move_to(cr, textX, textY + 28 * scale);
    std::string usernameText = "@" + data.username;
    cairo_show_text(cr, usernameText.c_str());

    // 4. Finalization & Cleanup
    std::string filename = "profile_renderer.png";
    cairo_surface_write_to_png(surface, filename.c_str());

    cairo_destroy(cr);
    cairo_surface_destroy(surface);

    return Napi::String::New(env, filename);
}

/**
 * @brief Initializes the N API addon, exporting the `RenderProfile` function
 * under the name `renderProfile`.
 */
Napi::Object Init(Napi::Env env, Napi::Object exports) {
    exports.Set("renderProfile", Napi::Function::New(env, RenderProfile));
    return exports;
}

// Register the addon with Node.js
NODE_API_MODULE(profile_renderer, Init)
