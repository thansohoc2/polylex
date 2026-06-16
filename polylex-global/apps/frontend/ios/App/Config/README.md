# iOS signing (local setup)

This folder contains build configuration (`.xcconfig`) files used by the Xcode project.

## Set your Development Team

Xcode requires a Development Team for device builds when code signing is enabled.

1. Open `App/App.xcodeproj` in Xcode.
2. Create/edit `User.xcconfig` (not committed) and set your Apple Team ID:

```xcconfig
DEVELOPMENT_TEAM = ABCDE12345
```

`User.xcconfig` is included (optionally) by `Base.xcconfig` and is ignored by git.
