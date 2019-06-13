import XCTest
import WebKit
import HoloflowsKit
import ConsolePrint

class TabsTests: XCTestCase {

    var browser = Browser()
    
    override func setUp() {
        super.setUp()
        browser = Browser()
    }
    
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
            consolePrint("\(String(describing: any)) \(error?.localizedDescription)")
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
        browser.send({ tabID: \(tab.id), message: JSON.stringify({ key:"value" }) });
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
            XCTAssertEqual(any as? String, "{\"key\":\"value\"}");
            resultCheckExpectation.fulfill()
        }
        wait(for: [resultCheckExpectation], timeout: 3.0, enforceOrder: true)
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
