// swift-tools-version: 5.9
import PackageDescription

// Manually added Package.swift for @codetrix-studio/capacitor-google-auth
// because this plugin does not ship a Package.swift (required by Capacitor 8 SPM).
// This file is copied into node_modules by the postinstall script.
let package = Package(
    name: "CodetrixStudioCapacitorGoogleAuth",
    platforms: [.iOS(.v14)],
    products: [
        .library(
            name: "CodetrixStudioCapacitorGoogleAuth",
            targets: ["CodetrixStudioCapacitorGoogleAuth"]
        )
    ],
    dependencies: [
        .package(url: "https://github.com/ionic-team/capacitor-swift-pm.git", from: "8.0.0"),
        .package(url: "https://github.com/google/GoogleSignIn-iOS.git", .upToNextMajor(from: "6.2.4"))
    ],
    targets: [
        .target(
            name: "CodetrixStudioCapacitorGoogleAuth",
            dependencies: [
                .product(name: "Capacitor", package: "capacitor-swift-pm"),
                .product(name: "Cordova", package: "capacitor-swift-pm"),
                .product(name: "GoogleSignIn", package: "GoogleSignIn-iOS")
            ],
            path: "ios/Plugin",
            exclude: ["Plugin.h", "Plugin.m", "Info.plist"]
        )
    ]
)
