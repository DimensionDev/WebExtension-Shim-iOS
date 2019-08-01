import XCTest
import WebExtension_Shim
import SwiftyJSON

class JSONRPCTests: XCTestCase {

    func testRequest() {
        let requestJSON = """
        {
            "jsonrpc": "2.0",
            "method": "testSendRequest",
            "params": "Hello, World!",
            "id": "1"
        }
        """
        let request = try! JSONDecoder().decode(StringRPCRequest.self, from: Data(requestJSON.utf8))
        XCTAssertEqual(request.jsonrpc, request.jsonrpc)
        XCTAssertEqual(request.method, request.method)
        XCTAssertEqual(request.params, request.params)
        XCTAssertEqual(request.id, request.id)
    }

    private struct StringRPCRequest: RPC.Request {
        var jsonrpc: String = RPC.Version.default
        var method: String = "testSendRequest"
        var params: String = "Hello, World!"
        var id: String = "1"
    }

}

extension JSONRPCTests {

    func testResponse() {
        let response = StringRPCResponse()
        let data = try! JSONEncoder().encode(response)
        let json = try! JSON(data: data)
        XCTAssertEqual(json["jsonrpc"].stringValue, response.jsonrpc)
        XCTAssertEqual(json["result"].stringValue, response.result)
        XCTAssertEqual(json["id"].stringValue, response.id)
    }

    private struct StringRPCResponse: RPC.Response {
        var jsonrpc: String = RPC.Version.default
        var result: String = "Hello, World!"
        var id: String = "1"
    }

}

extension JSONRPCTests {

    func testErrorResponse() {
        let response = StandardRPCErrorResponse()
        let data = try! JSONEncoder().encode(response)
        let json = try! JSON(data: data)
        XCTAssertEqual(json["jsonrpc"].stringValue, response.jsonrpc)
        XCTAssertEqual(json["error"]["code"].intValue, response.error.code)
        XCTAssertEqual(json["error"]["message"].stringValue, response.error.message)
        XCTAssertEqual(json["id"].stringValue, response.id)
    }

    private struct StandardRPCErrorResponse: RPC.ErrorResponse {
        var jsonrpc: String = RPC.Version.default
        var error = RPC.Error.internalError
        var id: String = "1"
    }

}
