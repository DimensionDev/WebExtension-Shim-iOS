#
# Be sure to run `pod lib lint HoloflowsKit.podspec' to ensure this is a
# valid spec before submitting.
#
# Any lines starting with a # are optional, but their use is encouraged
# To learn more about a Podspec see https://guides.cocoapods.org/syntax/podspec.html
#

Pod::Spec.new do |s|
  s.name             = 'HoloflowsKit'
  s.version          = '0.2.0'
  s.summary          = 'HoloflowsKit on iOS.'

# This description is used to generate tags and improve search results.
#   * Think: What does it do? Why did you write it? What is the focus?
#   * Try to keep it short, snappy and to the point.
#   * Write the description between the DESC delimiters below.
#   * Finally, don't worry about the indent, CocoaPods strips it!

  s.description      = <<-DESC
Implement basic web extension interface and provide strandard way to use HoloflowsKit in WKWebView.
                       DESC

  s.homepage         = 'https://github.com/SujiTech/HoloflowsKit-iOS'
  s.license          = { :type => 'AGPL', :file => 'LICENSE' }
  s.author           = { 'CMK' => 'cirno.mainasuk@gmail.com' }
  s.source           = { :git => 'https://github.com/SujiTech/HoloflowsKit-iOS.git', :tag => s.version.to_s }
  s.swift_version    = '5.0'

  # s.prepare_command = <<-CMD
  #   Source/HoloflowsKit/build.sh
  # CMD

  s.ios.deployment_target = '11.0'

  s.default_subspec = 'HoloflowsKit'

  s.source_files = 'Source/**/*'

  s.subspec 'HoloflowsKit' do |default_spec|
    default_spec.source_files = 'Source/HoloflowsKit/Classes/**/*'

    default_spec.resource_bundles = {
      'WebExtensionScripts' => ['Source/HoloflowsKit/Resources/*']
    }

    default_spec.dependency 'RealmSwift'
    default_spec.dependency 'Alamofire', '~> 4.7'
    default_spec.dependency 'AlamofireNetworkActivityLogger', '~> 2.4'
    default_spec.dependency 'HoloflowsKit/JSONRPC'
  end

  s.subspec 'JSONRPC' do |jsonRPC|
    jsonRPC.source_files = 'Source/JSONRPC/Classes/**/*'
  end

  s.test_spec 'Tests' do |test_spec|
    test_spec.source_files = 'Tests/**/*.swift'
    test_spec.resources = 'Tests/**/*.{html,tiff}'
  end

  s.dependency 'SwiftyJSON', '~> 5.0.0'
  s.dependency 'ConsolePrint'
  
end
