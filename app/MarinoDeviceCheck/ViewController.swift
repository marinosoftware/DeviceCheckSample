//
//  ViewController.swift
//  MarinoDeviceCheck
//
//  Created by Tim Colla on 16/09/2017.
//  Copyright © 2017 Marinosoftware. All rights reserved.
//

import UIKit
import DeviceCheck

class ViewController: UIViewController {
    @IBOutlet weak var bit0: UISwitch!
    @IBOutlet weak var bit1: UISwitch!
    @IBOutlet weak var activityIndicator: UIActivityIndicatorView!
    @IBOutlet weak var lastUpdated: UILabel!
    
    let host = "http://192.168.1.132:3000" // Change to your NodeJS server IP:port
    let curDevice = DCDevice.current

    override func viewDidLoad() {
        super.viewDidLoad()
        // Do any additional setup after loading the view, typically from a nib.

    }

    override func didReceiveMemoryWarning() {
        super.didReceiveMemoryWarning()
        // Dispose of any resources that can be recreated.
    }

    @IBAction func update(_ sender: UIButton) {
        startActivity()
        
        if curDevice.isSupported
        {

        curDevice.generateToken { (data, error) in
            if let data = data {
                let sesh = URLSession(configuration: .default)
                var req = URLRequest(url: URL(string:self.host+"/update_two_bits")!)
                req.addValue("application/json", forHTTPHeaderField: "Content-Type")
                req.httpMethod = "POST"

                DispatchQueue.main.sync {
                    let bit0 = self.bit0.isOn
                    let bit1 = self.bit1.isOn
                    let data = try! JSONSerialization.data(withJSONObject: ["token": data.base64EncodedString(),
                                                                            "bit0": bit0,
                                                                            "bit1": bit1], options: [])

                    req.httpBody = data
                    let task = sesh.dataTask(with: req, completionHandler: { (data, response, error) in
                        if let data = data, let jsonString = String(data: data, encoding: .utf8) {
                            print(jsonString)

                            DispatchQueue.main.async {
                                self.updateUI(with: data)
                            }
                        }

                        self.stopActivity()
                    })
                    task.resume()
                }
            }
            if let error = error {
                print("Generate Token error:")
                print(error.localizedDescription)
            }
            }
        } else {
            print("Platform is not supported. Make sure you aren't running in an emulator.")
            self.stopActivity()
            
        }

    }

    @IBAction func query(_ sender: UIButton) {
        startActivity()
        if curDevice.isSupported
        {

        DCDevice.current.generateToken { (data, error) in
            if let data = data {
                let sesh = URLSession(configuration: .default)
                var req = URLRequest(url: URL(string:self.host+"/query_two_bits")!)
                req.addValue("application/json", forHTTPHeaderField: "Content-Type")
                req.httpMethod = "POST"

                let data = try! JSONSerialization.data(withJSONObject: ["token": data.base64EncodedString()], options: [])

                req.httpBody = data
                let task = sesh.dataTask(with: req, completionHandler: { (data, response, error) in
                    if let data = data, let jsonString = String(data: data, encoding: .utf8) {
                        print(jsonString)

                        DispatchQueue.main.async {
                            self.updateUI(with: data)
                        }
                    }
                    
                    self.stopActivity()
                })
                task.resume()
            }
            if let error = error {
                print("Generate Token error:")
                print(error.localizedDescription)
            }
        }
        } else {
            print("Platform is not supported. Make sure you aren't running in an emulator.")
            self.stopActivity()
            
        }
    }

    func updateUI(with jsonData: Data) {
        do {
            let json = try JSONSerialization.jsonObject(with: jsonData, options: []) as! [String: Any]

            if let bit0 = json["bit0"] as? Bool, let bit1 = json["bit1"] as? Bool {
                self.bit0.isOn = bit0
                self.bit1.isOn = bit1
            }

            if let lastUpdated = json["lastUpdated"] as? String {
                self.lastUpdated.text = "Last Updated: "+lastUpdated
            }
        } catch {
            print(error.localizedDescription)
        }
    }

    func startActivity() {
        DispatchQueue.main.async {
            self.activityIndicator.startAnimating()

            self.view.isUserInteractionEnabled = false
            self.view.alpha = 0.5
        }
    }

    func stopActivity() {
        DispatchQueue.main.async {
            self.activityIndicator.stopAnimating()

            self.view.isUserInteractionEnabled = true
            self.view.alpha = 1.0
        }
    }
}

