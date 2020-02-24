# WebExtension-Shim

<!--[![CI Status](https://img.shields.io/travis/CMK/HoloflowsKit.svg?style=flat)](https://travis-ci.org/CMK/HoloflowsKit)
[![Version](https://img.shields.io/cocoapods/v/HoloflowsKit.svg?style=flat)](https://cocoapods.org/pods/HoloflowsKit)
[![License](https://img.shields.io/cocoapods/l/HoloflowsKit.svg?style=flat)](https://cocoapods.org/pods/HoloflowsKit)
[![Platform](https://img.shields.io/cocoapods/p/HoloflowsKit.svg?style=flat)](https://cocoapods.org/pods/HoloflowsKit)
-->
## Example

To run the example project, clone the repo, and run `pod install` from the Example directory first. You can check the unit test cases to see more detail.

## Requirements
- iOS 11+
- Xcode 10.2+
- Swift 5+

## Installation

WebExtension-Shim is available through [CocoaPods](https://cocoapods.org). To install
it, simply add the following line to your Podfile:

```ruby
pod 'WebExtension-Shim'
```

## Documents
[WebExtension-Shim Documents](./Documents.md)

## Maintains
```bash
git push

pod trunk me
pod lib lint --allow-warnings --no-clean --verbose --fail-fast
pod spec lint --allow-warnings --no-clean --verbose --fail-fast

pod repo push sujitech ./WebExtension-Shim.podspec --verbose --allow-warnings
```

## License

WebExtension-Shim is available under the AGPL license. See the LICENSE file for more info.
