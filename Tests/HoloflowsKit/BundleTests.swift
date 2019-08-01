import XCTest
import UIKit
import WebKit
import WebExtension_Shim
import ConsolePrint
import RealmSwift
import SwiftyJSON

class BundleTests: XCTestCase {

    func testBundle() {
        consolePrint(Bundle(for: Tab.self))
        consolePrint(Bundle.main)
        consolePrint(Bundle(for: BundleTests.self))
    }

    func testBundleGetResource() {
        let bundle = Bundle(for: BundleTests.self)
        let path = bundle.path(forResource: "lena_std.tif", ofType: "tiff")
        XCTAssertNotNil(path)

        let dataTaskExpectation = expectation(description: "dataTask")
        URLSession.shared.dataTask(with: URL(fileURLWithPath: path!)) { (data, response, error) in
            XCTAssertNotNil(data)
            XCTAssertEqual(data!.count, 786628)

            XCTAssertNotNil(response)
            XCTAssertEqual(response?.mimeType!, "image/tiff")
            XCTAssertEqual(response?.suggestedFilename, "lena_std.tif.tiff")

            dataTaskExpectation.fulfill()
        }.resume()

        wait(for: [dataTaskExpectation], timeout: 3.0)
    }

}
