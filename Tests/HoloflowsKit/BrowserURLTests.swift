//
//  BrowserURLTests.swift
//  HoloflowsKit-Unit-Tests
//
//  Created by Cirno MainasuK on 2019-6-24.
//

import XCTest
import WebKit
import HoloflowsKit
import SwiftyJSON
import ConsolePrint

class BrowserURLTests: XCTestCase {

    lazy var browser = Browser(core: self)

    let blobResourceManager = BlobResourceManager(realm: RealmService.default.realm)

    override func setUp() {
        super.setUp()
        browser = Browser(core: self)
    }

}

extension BrowserURLTests: BrowserCore {

    func plugin(forScriptType type: Plugin.ScriptType) -> Plugin {
        return Plugin(id: UUID().uuidString, manifest: JSON.null, environment: type, resources: JSON.null)
    }

    func tabs(_ tabs: Tabs, webViewConfigurationForOptions options: WebExtension.Browser.Tabs.Create.Options?) -> WKWebViewConfiguration {
        let configuration = WKWebViewConfiguration()
        configuration.setURLSchemeHandler(blobResourceManager, forURLScheme: "holoflows-blob")
        return configuration
    }

    func uiDelegate(for tab: Tab) -> WKUIDelegate? {
        return nil
    }

    func navigationDelegate(for tab: Tab) -> WKNavigationDelegate? {
        return nil
    }

    func tab(_ tab: Tab, bundleResourceManagerOfExtensionID extensionID: String, forPath path: String) -> BundleResourceManager? {
        return nil
    }

    func tab(_ tab: Tab, blobResourceManagerOfExtensionID extensionID: String, forPath path: String) -> BlobResourceManager? {
        return blobResourceManager
    }

    func tab(_ tab: Tab, willDownloadBlobWithOptions options: WebExtension.Browser.Downloads.Download.Options) {
        // do nothing
    }

    func tab(_ tab: Tab, didDownloadBlobWithOptions options: WebExtension.Browser.Downloads.Download.Options, result: Result<BlobStorage, Error>) {
        // do nothing
    }


}

extension BrowserURLTests {

    func testCreateObjectURL() {
        let tab = browser.tabs.create(options: nil)
        TestHelper.prepareTest(tab: tab, forTestCase: self)

        let createObjectURLID = UUID().uuidString
        let blobID = UUID().uuidString
        let addListenerScript = """
        var width = 0;
        document.addEventListener('\(ScriptEvent.holoflowsjsonrpc.rawValue)', event => {
            if (event.detail.id != '\(createObjectURLID)') { return; }

            const url = 'holoflows-blob://HoloflowsKit-UnitTests/\(blobID)'
            \(TestHelper.echoScript(val: "url"))
            var blobImage = document.createElement('img');
            blobImage.onload = function() {
                width = this.clientWidth;
            };
            blobImage.id = 'blobImage';
            blobImage.src = url + '.png';
            document.body.appendChild(blobImage);
        });
        """
        let addListenerExpectation = TestHelper.expectEvaluateJavaScript(in: tab.webView, script: addListenerScript, forTestCase: self) { (any, error) in
            // do nothing
        }
        wait(for: [addListenerExpectation], timeout: 3.0)

        // creat blob url
        let image = UIImage(named: "lena_std.tif.tiff", in: Bundle(for: BrowserURLTests.self), compatibleWith: nil)!
        let base64EncodedString = image.pngData()!.base64EncodedString()
        let data = WebExtension.StringOrBlob(type: .blob, content: base64EncodedString, mimeType: "image/png")
        let createObjectURL = WebExtension.URL.CreateObjectURL(extensionID: "HoloflowsKit-UnitTests", uuid: blobID, data: data)
        let createObjectURLScript = TestHelper.webKit(messageBody: HoloflowsRPC.Request(params: createObjectURL, id: createObjectURLID))
        let createObjectURLExpectation = TestHelper.expectEvaluateJavaScript(in: tab.webView, script: createObjectURLScript, forTestCase: self) { (any, error) in
            // do nothing
        }
        wait(for: [createObjectURLExpectation], timeout: 3.0)

        // check image
        TestHelper.waitCallback(3.0, forTestCase: self)
        let checkSizeExpectation = TestHelper.expectEvaluateJavaScript(in: tab.webView, script: "width;", forTestCase: self) { (any, error) in
            XCTAssertEqual(any as? Int, 512)
        }
        wait(for: [checkSizeExpectation], timeout: 3.0)

        consolePrint(RealmService.default.realm.configuration.fileURL!)
    }

}
