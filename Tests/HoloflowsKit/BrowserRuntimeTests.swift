//
//  BrowserRuntimeTests.swift
//  HoloflowsKit-Unit-Tests
//
//  Created by Cirno MainasuK on 2019-6-24.
//

import XCTest
import WebKit
import HoloflowsKit
import SwiftyJSON
import ConsolePrint

class BrowserRuntimeTests: XCTestCase {

    var browser = Browser()

    override func setUp() {
        super.setUp()
        browser = Browser()
    }

}

extension BrowserRuntimeTests {

    func testGetURL() {
        let bundleResourceManager = BundleResourceManager(bundle: Bundle(for: BrowserRuntimeTests.self))
        browser.bundleResourceManager = bundleResourceManager

        let tab = browser.tabs.create(options: nil)
        TestHelper.prepareTest(tab: tab, forTestCase: self)

        let getURLID = UUID().uuidString
        let addListenerScript = """
        var url = '';
        document.addEventListener('\(ScriptEvent.holoflowsjsonrpc.rawValue)', event => {
            if (event.detail.id != '\(getURLID)') { return; }

            url = event.detail.result;
            \(TestHelper.echoScript(val: "url"))
        });
        """
        let addListenerExpectation = TestHelper.expectEvaluateJavaScript(in: tab.webView, script: addListenerScript, forTestCase: self) { (any, error) in
            // do nothing
        }
        wait(for: [addListenerExpectation], timeout: 3.0)

        let getURL = WebExtension.Browser.Runtime.GetURL(extensionID: "HoloflowsKit-UnitTests", path: "/lena_std.tif.tiff")
        let getURLScript = TestHelper.webKit(messageBody: HoloflowsRPC.Request(params: getURL, id: getURLID))
        let getURLExpectation = TestHelper.expectEvaluateJavaScript(in: tab.webView, script: getURLScript, forTestCase: self) { (any, error) in
            // do nothing
        }
        wait(for: [getURLExpectation], timeout: 3.0)

        // check url
        TestHelper.waitCallback(3.0, forTestCase: self)
        let checkURLExpectation = TestHelper.expectEvaluateJavaScript(in: tab.webView, script: "url;", forTestCase: self) { (any, error) in
            XCTAssertEqual(any as? String, "holoflows-kit://HoloflowsKit-UnitTests/lena_std.tif.tiff")
        }
        wait(for: [checkURLExpectation], timeout: 3.0)
    }

}

extension BrowserRuntimeTests {

    public func testRuntimeGetManifest() {
        let tab = browser.tabs.create(options: nil)
        let tabDelegate = TabDelegateStub()
        tab.delegate = tabDelegate
        TestHelper.prepareTest(tab: tab, forTestCase: self)

        let getManifestID = UUID().uuidString
        let addListenerScript = """
        var manifest = { };
        document.addEventListener('\(ScriptEvent.holoflowsjsonrpc.rawValue)', event => {
            if (event.detail.id != '\(getManifestID)') { return; }

            manifest = event.detail.result;
            \(TestHelper.echoScript(val: "url"))
        });
        """
        let addListenerExpectation = TestHelper.expectEvaluateJavaScript(in: tab.webView, script: addListenerScript, forTestCase: self) { (any, error) in
            // do nothing
        }
        wait(for: [addListenerExpectation], timeout: 3.0)

        let getManifest = WebExtension.Browser.Runtime.GetManifest(extensionID: "HoloflowsKit-UnitTests")
        let getManifestScript = TestHelper.webKit(messageBody: HoloflowsRPC.Request(params: getManifest, id: getManifestID))
        let getManifestExpectation = TestHelper.expectEvaluateJavaScript(in: tab.webView, script: getManifestScript, forTestCase: self) { (any, error) in
            // do nothing
        }
        wait(for: [getManifestExpectation], timeout: 3.0)

        let checkManifestExpectation = TestHelper.expectEvaluateJavaScript(in: tab.webView, script: "manifest;", forTestCase: self) { (any, error) in
            XCTAssertNotNil(any)
            let manifest = JSON(rawValue: any!)
            XCTAssertEqual(manifest, JSON(rawValue: BrowserRuntimeTests.manifest))
            XCTAssertEqual(manifest!["content_scripts"].arrayValue.first?["all_frames"].bool, true)
        }
        wait(for: [checkManifestExpectation], timeout: 3.0)
    }

    private class TabDelegateStub: TabDelegate {
        func tab(_ tab: Tab, requestManifestForExtension extensionID: String) -> String {
            return String(data: BrowserRuntimeTests.manifest, encoding: .utf8)!
        }

        func tab(_ tab: Tab, requestBundleResourceManager: Void) -> BundleResourceManager? {
            return CustomURLSchemeHandler()
        }

        func tab(_ tab: Tab, requestBlobResourceManager: Void) -> BlobResourceManager? {
            return nil
        }

        func tab(_ tab: Tab, willDownloadBlobWithOptions options: WebExtensionAPI.DownloadOptions) {
            // do nothing
        }

        func tab(_ tab: Tab, didDownloadBlobWithOptions options: WebExtensionAPI.DownloadOptions, result: Result<BlobStorage, Error>) {
            // do nothing
        }
    }

    private static var manifest = """
    {
        "$schema": "http://json.schemastore.org/chrome-manifest",
        "name": "Maskbook",
        "version": "1.3.2",
        "manifest_version": 2,
        "content_scripts": [
            {
                "matches": ["https://www.facebook.com/*"],
                "js": ["polyfill/adoptedStyleSheets.js", "polyfill/browser-polyfill.min.js", "js/contentscript.js"],
                "run_at": "document_idle",
                "all_frames": true
            }
        ],
        "web_accessible_resources": ["*.css", "*.js", "*.jpg", "*.png"],
        "permissions": ["https://www.facebook.com/*", "storage", "downloads", "background", "webNavigation"],
        "background": {
            "scripts": ["polyfill/webcrypto-liner.shim.js", "polyfill/browser-polyfill.min.js", "js/backgroundservice.js"]
        },
        "options_ui": {
            "page": "index.html",
            "open_in_tab": true
        },
        "icons": {
            "16": "16x16.png",
            "48": "48x48.png",
            "128": "128x128.png",
            "256": "256x256.png"
        },
        "homepage_url": "https://maskbook.io",
        "description": "__MSG_manifest_description__",
        "default_locale": "en"
    }
    """.data(using: .utf8)!

    private class CustomURLSchemeHandler: BundleResourceManager {

        var handlerExpectation: XCTestExpectation?

        init() {
            super.init(bundle: Bundle())
        }

        override init(bundle: Bundle) {
            super.init(bundle: bundle)
        }

        override func webView(_ webView: WKWebView, start urlSchemeTask: WKURLSchemeTask) {
            consolePrint(urlSchemeTask.request)

            XCTAssertEqual(URL(string: "holoflows-kit://images/lena_std.tif.tiff"), urlSchemeTask.request.url)
            let fileExtension = urlSchemeTask.request.url?.pathExtension
            let filename = urlSchemeTask.request.url?.deletingPathExtension().lastPathComponent
            XCTAssertEqual(fileExtension, "tiff")
            XCTAssertEqual(filename, "lena_std.tif")

            handlerExpectation?.fulfill()
        }

        override func webView(_ webView: WKWebView, stop urlSchemeTask: WKURLSchemeTask) {
            // do nothing
        }
    }

}
