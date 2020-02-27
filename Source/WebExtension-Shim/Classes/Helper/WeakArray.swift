//
//  WeakArray.swift
//  WebExtension-Shim
//
//  Created by MainasuK Cirno on 2020/2/27.
//

import Foundation

public struct WeakArray<Element: AnyObject> {
    
    private var items: [WeakBox<Element>] = []

    public init(_ elements: [Element]) {
        items = elements.map { WeakBox($0) }
    }
    
}

extension WeakArray: Collection {
    
    public typealias SubSequence = WeakArray<Element>
    public typealias Element = Optional<Element>
    public typealias Index = Int
    
    public var startIndex: Int { return items.startIndex }
    public var endIndex: Int { return items.endIndex }
    
    public subscript(_ index: Index) -> Element? {
        get { items[index].unbox }
        set (newValue) { items[index] = WeakBox(newValue ?? nil) }
    }
    
    public func index(after idx: Int) -> Int {
        return items.index(after: idx)
    }
    
}

extension WeakArray: RangeReplaceableCollection {
    public init() { }
    
    
    public mutating func replaceSubrange<C>(_ subrange: Range<Self.Index>, with newElements: C) where C : Collection, WeakArray.Element == C.Element {
        let boxNewElements = newElements.map { WeakBox($0) }
        items.replaceSubrange(subrange, with: boxNewElements)
    }
}


extension WeakArray {
    
    public var unboxItems: [Element] {
        return items.compactMap { $0.unbox }
    }

}
