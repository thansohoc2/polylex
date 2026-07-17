// swift-tools-version: 5.9
import PackageDescription

// Capacitor 8 compatibility patch for @capacitor-community/apple-sign-in 7.1.0.
// The plugin source is compatible with Capacitor 8, but the published package
// still declares a Capacitor 7 Swift package dependency.
let package = Package(
    name: "CapacitorCommunityAppleSignIn",
    platforms: [.iOS(.v15)],
    products: [
        .library(
            name: "CapacitorCommunityAppleSignIn",
            targets: ["SignInWithApple"])
    ],
    dependencies: [
        .package(url: "https://github.com/ionic-team/capacitor-swift-pm.git", from: "8.0.0")
    ],
    targets: [
        .target(
            name: "SignInWithApple",
            dependencies: [
                .product(name: "Capacitor", package: "capacitor-swift-pm"),
                .product(name: "Cordova", package: "capacitor-swift-pm")
            ],
            path: "ios/Sources/SignInWithApple"),
        .testTarget(
            name: "SignInWithAppleTests",
            dependencies: ["SignInWithApple"],
            path: "ios/Tests/SignInWithAppleTests")
    ]
)
