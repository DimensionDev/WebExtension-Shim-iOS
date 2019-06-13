//
//  Browser.swift
//  HoloflowsKit
//
//  Created by Cirno MainasuK on 2019-6-10.
//

import Foundation

public class Browser {

    // MARK: - Singleton
    public static let `default` = Browser()

    public let tabs = Tabs()

    public init() { }

}
