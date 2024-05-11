{
    "targets": [
        {
            "target_name": "laToolkitWin32x64",
            "cflags!": ["-fno-exceptions"],
            "cflags_cc!": ["-fno-exceptions"],
            "sources": ["la_toolkit.cc"],
            "include_dirs": [
                "<!@(node -p \"require('node-addon-api').include\")"
            ],
            'defines': ['NAPI_DISABLE_CPP_EXCEPTIONS'],
            "libraries": [
                "-lntdll"
            ]
        },

    ]
}
