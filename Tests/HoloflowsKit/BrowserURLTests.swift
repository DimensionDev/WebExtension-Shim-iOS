//
//  BrowserURLTests.swift
//  HoloflowsKit-Unit-Tests
//
//  Created by Cirno MainasuK on 2019-6-24.
//

import XCTest
import HoloflowsKit
import ConsolePrint

class BrowserURLTests: XCTestCase {

    var browser = Browser()

    override func setUp() {
        super.setUp()
        browser = Browser()
    }

}

extension BrowserURLTests {

    func testCreateObjectURL() {
        let bundleResourceManager = BundleResourceManager(bundle: Bundle(for: TabsTests.self))
        let blobResourceManager = BlobResourceManager()
        browser.bundleResourceManager = bundleResourceManager
        browser.blobResourceManager = blobResourceManager

        let tab = browser.tabs.create(options: nil)
        TestHelper.prepareTest(tab: tab, forTestCase: self)

        let createObjectURLID = UUID().uuidString
        let addListenerScript = """
        var width = 0;
        document.addEventListener('\(ScriptEvent.holoflowsjsonrpc.rawValue)', event => {
            if (event.detail.id != '\(createObjectURLID)') { return; }

            const url = event.detail.result;
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
        let image = UIImage(named: "lena_std.tif.tiff", in: Bundle(for: TabsTests.self), compatibleWith: nil)!
        let base64EncodedString = image.pngData()!.base64EncodedString()
        let createObjectURL = WebExtension.URL.CreateObjectURL(extensionID: "HoloflowsKit-UnitTests", blob: base64EncodedString, type: "image/png")
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
