'use client'

import { useState } from 'react'
import { parsePhoneNumber, isValidPhoneNumber, formatIncompletePhoneNumber, CountryCode } from 'libphonenumber-js'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertCircle } from 'lucide-react'

interface CountryConfig {
  trunkPrefix: string;
  addLeadingZero: boolean;
}

interface Configs {
  [key: string]: CountryConfig;
}

const phoneEngine = (number: string, options = {}, countryConfigs: Configs = {}) => {
  // Default configuration
  let config = {
    country: "",
    trunkPrefix: "",
    addLeadingZero: false,
    ...options,
  };

  // Use country-specific config if available
  let phoneNumber;
  try {
    phoneNumber = parsePhoneNumber(number, config.country);
  } catch (error) {
    console.error('Error parsing phone number:', error);
    return { e164: '', forAsterisk: '', isValid: false };
  }

  if (!phoneNumber) {
    return { e164: '', forAsterisk: '', isValid: false };
  }

  if(countryConfigs[phoneNumber.country]){
      config = countryConfigs[phoneNumber.country];
  }
  
  let processedNumber = phoneNumber.nationalNumber

  if (config.addLeadingZero && !processedNumber.startsWith("0")) {
    processedNumber = '0' + processedNumber;
  }

  // Add the trunk prefix if provided
  const forAsterisk = config.trunkPrefix
    ? `${config.trunkPrefix}${processedNumber}`
    : processedNumber;
  const isValid = phoneNumber.isValid() && phoneNumber.isPossible()
  return {
    e164: isValid ? phoneNumber.format('E.164') : '---',
    forAsterisk: isValid && phoneNumber.country === config.country ? forAsterisk : number.replaceAll(' ',''),
    isValid: isValid
  };
};

export default function PhoneEngineDemo() {
  const [phoneNumber, setPhoneNumber] = useState('')
  const [result, setResult] = useState<{ e164: string; forAsterisk: string; isValid: boolean } | null>(null)
  const [config, setConfig] = useState({
    country: 'EG' as CountryCode,
    trunkPrefix: '',
    addLeadingZero: false
  })
  const [countryConfigs, setCountryConfigs] = useState<Configs>({})
  const [defaultConfig, setDefaultConfig] = useState<CountryCode>('EG')

  const handleProcess = () => {
    try {
      const processed = phoneEngine(phoneNumber, countryConfigs[defaultConfig] || {}, countryConfigs)
      setResult(processed)
    } catch (error) {
      console.error(error)
      setResult(null)
    }
  }

  const handlePhoneNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedNumber = formatIncompletePhoneNumber(e.target.value, config.country)
    setPhoneNumber(formattedNumber)
  }

  const handleAddConfig = () => {
    setCountryConfigs({
      ...countryConfigs,
      [config.country]: config
    })
  }

  const handleRemoveConfig = (country: CountryCode) => {
    const newConfigs = { ...countryConfigs }
    delete newConfigs[country]
    setCountryConfigs(newConfigs)
    if (defaultConfig === country) {
      setDefaultConfig('EG')
    }
  }

  return (
    <div className="container mx-auto p-4 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Phone Number Normalizer</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex space-x-2">
            <Input
              type="tel"
              placeholder="Enter phone number"
              value={phoneNumber}
              onChange={handlePhoneNumberChange}
              aria-label="Phone number input"
            />
            <Button onClick={handleProcess}>Normalize</Button>
          </div>
          {result && (
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <p><strong>E.164 format:</strong> {result.e164}</p>
                {!result.isValid && (
                  <div className="flex items-center text-yellow-500" role="alert">
                    <AlertCircle className="w-4 h-4 mr-1" aria-hidden="true" />
                    <span className="text-sm">Invalid e.164 phone number</span>
                  </div>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <p><strong>For Asterisk:</strong> {result.forAsterisk}</p>
                {!result.isValid && (
                  <div className="flex items-center text-green-500" role="alert">
                    <AlertCircle className="w-4 h-4 mr-1" aria-hidden="true" />
                    <span className="text-sm">Considered As Is</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Label htmlFor="country">Country</Label>
            <Select
              value={config.country}
              onValueChange={(value) => setConfig({ ...config, country: value as CountryCode })}
            >
              <SelectTrigger id="country">
                <SelectValue placeholder="Select country" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="EG">Egypt</SelectItem>
                <SelectItem value="US">United States</SelectItem>
                <SelectItem value="SA">Saudi Arabia</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center space-x-2">
            <Label htmlFor="trunkPrefix">Trunk Prefix</Label>
            <Input
              id="trunkPrefix"
              type="text"
              value={config.trunkPrefix}
              onChange={(e) => setConfig({ ...config, trunkPrefix: e.target.value })}
              placeholder="Enter trunk prefix"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Label htmlFor="addLeadingZero">Add Leading Zero</Label>
            <Switch
              id="addLeadingZero"
              checked={config.addLeadingZero}
              onCheckedChange={(checked) => setConfig({ ...config, addLeadingZero: checked })}
            />
          </div>
          <Button onClick={handleAddConfig}>Add/Update Country Config</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Country Configurations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.entries(countryConfigs).map(([country, countryConfig]) => (
            <div key={country} className="flex items-center justify-between">
              <span>{country}</span>
              <div>
                <span>Trunk Prefix: {countryConfig.trunkPrefix}</span>
                <span className="ml-2">Add Leading Zero: {countryConfig.addLeadingZero ? 'Yes' : 'No'}</span>
              </div>
              <Button variant="destructive" onClick={() => handleRemoveConfig(country as CountryCode)}>Remove</Button>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Default Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <Label htmlFor="defaultConfig">Default Country</Label>
            <Select
              value={defaultConfig}
              onValueChange={(value) => setDefaultConfig(value as CountryCode)}
            >
              <SelectTrigger id="defaultConfig">
                <SelectValue placeholder="Select default country" />
              </SelectTrigger>
              <SelectContent>
                {Object.keys(countryConfigs).map((country) => (
                  <SelectItem key={country} value={country}>{country}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

