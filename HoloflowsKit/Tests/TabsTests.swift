import XCTest
import WebKit
import HoloflowsKit
import ConsolePrint
import RealmSwift
import SwiftyJSON

class TabsTests: XCTestCase {

    var browser = Browser()
    
    override func setUp() {
        super.setUp()
        browser = Browser()
    }

}

extension TabsTests {
    
    func testCreate() {
        XCTAssertEqual(browser.tabs.storage.count, 0)
        let tab = browser.tabs.create(createProperties: nil)
        XCTAssertEqual(tab.id, 0)
        XCTAssertEqual(browser.tabs.storage.count, 1)
    }

    func testRemove() {
        XCTAssertEqual(browser.tabs.storage.count, 0)
        let tab = browser.tabs.create(createProperties: nil)
        XCTAssertEqual(tab.id, 0)
        XCTAssertEqual(browser.tabs.storage.count, 1)
        browser.tabs.remove(id: tab.id)
        XCTAssertEqual(browser.tabs.storage.count, 0)
    }

    func testCreateAndRemove() {
        let tab = browser.tabs.create(createProperties: nil)
        prepareTest(tab: tab)
        XCTAssertEqual(browser.tabs.storage.count, 1)

        let createScript = """
        browser.tabsCreate({ createProperties: { url: "https://www.apple.com" } });
        """
        let createScriptExpectation = expectEvaluateJavaScript(in: tab.webView, script: createScript) { (any, error) in
            // do nothing
        }
        wait(for: [createScriptExpectation], timeout: 5.0)
        waitCallback(3)
        XCTAssertEqual(browser.tabs.storage.count, 2)

        let removeScript = """
        browser.tabsRemove({ tabIds: 1 });
        """
        let removeScriptExpectation = expectEvaluateJavaScript(in: tab.webView, script: removeScript) { (any, error) in
            // do nothing
        }
        wait(for: [removeScriptExpectation], timeout: 5.0)
        waitCallback(3)
        XCTAssertEqual(browser.tabs.storage.count, 1)
    }

}

extension TabsTests {

    func testEcho() {
        let tab = browser.tabs.create(createProperties: nil)
        prepareTest(tab: tab)

        let echoExpectation = expectation(description: "echo")
        let echoScript = """
        browser.echo(
            { "key": "Hello, World!" }
        );
        """
        tab.webView.evaluateJavaScript(echoScript) { (any, error) in
            consolePrint("\(String(describing: any)) \(error?.localizedDescription ?? "")")
            echoExpectation.fulfill()
        }
        wait(for: [echoExpectation], timeout: 3.0, enforceOrder: true)

        let waitEchoConsolePrintExpectation = expectation(description: "waitEchoConsolePrint")
        DispatchQueue.main.asyncAfter(deadline: .now() + 3) {
            waitEchoConsolePrintExpectation.fulfill()
        }
        wait(for: [waitEchoConsolePrintExpectation], timeout: 4)
        // ^ Tab.swift[87], userContentController(_:didReceive:): [echo]: {"messageID":"0.o1brjamoei","key":"Hello, World!"}
    }

}

extension TabsTests {

    func testScriptExecute() {
        let tab = browser.tabs.create(createProperties: nil)
        prepareTest(tab: tab)

        let addFunctionExpectation = expectation(description: "addFunction")
        let addFunctionScript = """
        function plus(lhs, rhs) {
            return lhs + rhs;
        };
        """
        tab.webView.evaluateJavaScript(addFunctionScript) { (any, error) in
            XCTAssertNil(error, error?.localizedDescription ?? "")
            addFunctionExpectation.fulfill()
        }
        wait(for: [addFunctionExpectation], timeout: 3.0, enforceOrder: true)

        let calculateExpectation = expectation(description: "calculate")
        let calculateScript = """
        browser.tabsExecuteScript({
            tabId: 0,
            details: {
                code: "var result = plus(50 * 8, 2);"
            }
        });
        """
        tab.webView.evaluateJavaScript(calculateScript) { (any, error) in
            consolePrint("\(String(describing: any)), \(error?.localizedDescription ?? "")")
            calculateExpectation.fulfill()
        }
        wait(for: [calculateExpectation], timeout: 3.0, enforceOrder: true)

        let resultCheckExpectation = expectation(description: "resultCheck")
        tab.webView.evaluateJavaScript("result;") { (any, error) in
            XCTAssertEqual(any as? Int, 402);
            resultCheckExpectation.fulfill()
        }
        wait(for: [resultCheckExpectation], timeout: 3.0, enforceOrder: true)
    }

    func testSendReceive() {
        let tab = browser.tabs.create(createProperties: nil)
        prepareTest(tab: tab)

        let addReceiveListenerScript = """
        var result = '';
        document.addEventListener('receive', event => {
            result = event.detail.message;
            browser.echo({result});
        });
        """
        tab.webView.evaluateJavaScript(addReceiveListenerScript, completionHandler: nil)

        let sendExpectation = expectation(description: "send")
        let sendScript = """
        browser.send({ tabID: \(tab.id), message: { key:"value" } });
        """
        tab.webView.evaluateJavaScript(sendScript) { (any, error) in
            consolePrint("\(String(describing: any)) \(error?.localizedDescription ?? "")")
            sendExpectation.fulfill()
        }
        wait(for: [sendExpectation], timeout: 3.0)

        let callbackWaitExpectation = expectation(description: "callbackWait")
        DispatchQueue.main.asyncAfter(deadline: .now() + 3) {
            callbackWaitExpectation.fulfill()
        }
        wait(for: [callbackWaitExpectation], timeout: 4)

        let resultCheckExpectation = expectation(description: "resultCheck")
        tab.webView.evaluateJavaScript("result;") { (any, error) in
            XCTAssertNil(error, error?.localizedDescription ?? "")
            XCTAssertNotNil(any)
            XCTAssertEqual(JSON(rawValue: any!)!["key"], "value");
            resultCheckExpectation.fulfill()
        }
        wait(for: [resultCheckExpectation], timeout: 3.0, enforceOrder: true)
    }

}

extension TabsTests {

    func testStorageLocalSet() {
        let tab = browser.tabs.create(createProperties: nil)
        prepareTest(tab: tab)
        removeRealmDataStub()

        let setScript = """
        browser.storageLocalSet({
            keys: {
                kitten: { name:"Moggy", tentacles: false, eyeCount: 2 },
                monster: { name: "Kraken", tentacles: true, eyeCount: 10 }
            }
        });
        """
        let scriptExpectation = expectEvaluateJavaScript(in: tab.webView, script: setScript) { any, error in
            // do nothing
        }
        wait(for: [scriptExpectation], timeout: 3.0)

        consolePrint(try! Realm().configuration.fileURL)
        // file:///Users/MainasuK/Library/Developer/CoreSimulator/Devices/52666318-D601-4CFF-B697-4DCAF255E8CD/data/Documents/default.realm

        waitCallback(5)

        let entriesRetrieved = getRealmDataStub()
        XCTAssertEqual(entriesRetrieved.count, 2)
    }

    func testStorageLocalGet() {
        let tab = browser.tabs.create(createProperties: nil)
        prepareTest(tab: tab)
        addRealmDataStub()

        // call get script
        let getScript = """
        browser.storageLocalGet({
            keys: [ 'kitten', 'monster' ]
        });
        """
        let scriptExpectation = expectEvaluateJavaScript(in: tab.webView, script: getScript) { any, error in
            // do nothing
        }
        wait(for: [scriptExpectation], timeout: 3.0)

        consolePrint(try! Realm().configuration.fileURL)
        // file:///Users/MainasuK/Library/Developer/CoreSimulator/Devices/52666318-D601-4CFF-B697-4DCAF255E8CD/data/Documents/default.realm

        waitCallback(5)
        // document.dispatchEvent(new CustomEvent('0.1ls5p0e630o', {"detail":{"monster":"{ name: \"Kraken\", tentacles: true, eyeCount: 10 }","kitten":"{ name:\"Moggy\", tentacles: false, eyeCount: 2 }"}}))
    }

    func testStorageLocalRemove() {
        let tab = browser.tabs.create(createProperties: nil)
        prepareTest(tab: tab)
        addRealmDataStub()

        XCTAssertEqual(getRealmDataStub().count, 2)

        // call remove script
        let removeScript = """
        browser.storageLocalRemove({
            keys: 'kitten'
        });
        """
        let scriptExpectation = expectEvaluateJavaScript(in: tab.webView, script: removeScript) { any, error in
            // do nothing
        }
        wait(for: [scriptExpectation], timeout: 3.0)

        consolePrint(try! Realm().configuration.fileURL)
        // file:///Users/MainasuK/Library/Developer/CoreSimulator/Devices/52666318-D601-4CFF-B697-4DCAF255E8CD/data/Documents/default.realm

        waitCallback(5)
        // dispatchEvent(webView:eventName:result:completionHandler:): document.dispatchEvent(new CustomEvent('0.byfgbqnopbq', {"detail":{"kitten":"{ name:\"Moggy\", tentacles: false, eyeCount: 2 }"}}))

        XCTAssertEqual(getRealmDataStub().count, 1)
    }

    func testStorageLocalClear() {
        let tab = browser.tabs.create(createProperties: nil)
        prepareTest(tab: tab)
        addRealmDataStub()

        XCTAssertEqual(getRealmDataStub().count, 2)

        // call clear script
        let clearScript = """
        browser.storageLocalClear();
        """
        let scriptExpectation = expectEvaluateJavaScript(in: tab.webView, script: clearScript) { any, error in
            // do nothing
        }
        wait(for: [scriptExpectation], timeout: 3.0)

        consolePrint(try! Realm().configuration.fileURL)
        // file:///Users/MainasuK/Library/Developer/CoreSimulator/Devices/52666318-D601-4CFF-B697-4DCAF255E8CD/data/Documents/default.realm

        waitCallback(5)
        // document.dispatchEvent(new CustomEvent('0.pke999u8a2', {"detail":{"monster":"{ name: \"Kraken\", tentacles: true, eyeCount: 10 }","kitten":"{ name:\"Moggy\", tentacles: false, eyeCount: 2 }"}}))

        XCTAssertEqual(getRealmDataStub().count, 0)
    }

    private func removeRealmDataStub() {
        let realm = try! Realm()
        // purge database
        let entriesToRemove = realm.objects(LocalStorage.self).filter { ["kitten", "monster"].contains($0.key) }
        realm.beginWrite()
        realm.delete(entriesToRemove)
        try! realm.commitWrite()
    }

    private func addRealmDataStub() {
        let realm = try! Realm()
        realm.beginWrite()
        let kitten: LocalStorage = {
            let entry = LocalStorage()
            entry.key = "kitten"
            entry.value = """
            { name:"Moggy", tentacles: false, eyeCount: 2 }
            """
            return entry
        }()
        let monster: LocalStorage = {
            let entry = LocalStorage()
            entry.key = "monster"
            entry.value = """
            { name: "Kraken", tentacles: true, eyeCount: 10 }
            """
            return entry
        }()

        realm.add([kitten, monster], update: .all)
        try! realm.commitWrite()
    }

    private func getRealmDataStub() -> [LocalStorage] {
        let realm = try! Realm()
        return realm.objects(LocalStorage.self).filter { ["kitten", "monster"].contains($0.key) }
    }

}

extension TabsTests {

    private func prepareTest(tab: Tab) {
        if tab.webView.url == nil {
            tab.webView.loadHTMLString("", baseURL: nil)
        }

        // wait for browser script inject
        let sleepExpectation = expectation(description: "sleep")
        DispatchQueue.main.asyncAfter(deadline: .now() + 5) {
            sleepExpectation.fulfill()
        }
        wait(for: [sleepExpectation], timeout: 6.0)
    }

}

extension TabsTests {

    func expectEvaluateJavaScript(in webView: WKWebView, script: String, completionHandler: @escaping ((Any?, Error?) -> Void)) -> XCTestExpectation {
        let scriptExpectation = expectation(description: "evaluate java script")

        webView.evaluateJavaScript(script) { (any, error) in
            consolePrint("\(String(describing: any)) \(error?.localizedDescription ?? "")")
            completionHandler(any, error)
            scriptExpectation.fulfill()
        }

        return scriptExpectation
    }

    func waitCallback(_ timeout: TimeInterval) {
        let waitCallbackExpectation = expectation(description: "waitCallback")

        DispatchQueue.main.asyncAfter(deadline: .now() + timeout) {
            waitCallbackExpectation.fulfill()
        }

        wait(for: [waitCallbackExpectation], timeout: timeout * 2)
    }

}
