{
  "targets": [
    {
      "target_name": "profile_renderer",
      "cflags!": ["-fno-exceptions"],
      "cflags_cc!": ["-fno-exceptions"],
      "defines": ["NAPI_CPP_EXCEPTIONS"],
      "sources": ["native/profile_renderer.cpp"],
      "include_dirs": ["<!@(node -p \"require('node-addon-api').include\")"],
      "libraries": ["-lcairo"],
      "conditions": [
        [
          "OS=='win'",
          {
            "libraries": ["cairo.lib"]
          }
        ]
      ]
    }
  ]
}
