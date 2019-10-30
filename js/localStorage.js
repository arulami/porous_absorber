/***********************************************************************************************************************
 * Porous Absorber Calculator
 * 
 * Local storage utility functions
 * 
 * (c) Chris Whealy 2019
 **********************************************************************************************************************/

import { tabConfig } from "./tabConfig.js"

import {
  setProperty
, isNull
, isNullOrUndef
} from "./utils.js"

// *********************************************************************************************************************
// Define trace functions
import { define_trace } from "./appConfig.js"
const { traceBoundary, traceInfo } = define_trace("localStorage")

// *********************************************************************************************************************
// Check if local storage is available
// Warning: This function cannot be run before the HTML page has fully initialised!
const storageAvailable =
  type => {
    let storage

    try {
      storage = window[type]
      var x = '__storage_test__'
      storage.setItem(x, x)
      storage.removeItem(x)
      return true
    }
    catch(e) {
      return e instanceof DOMException &&
        // everything except Firefox
      ( e.code === 22 ||
        // Firefox
        e.code === 1014 ||
        // test name field too, because code might not be present
        // everything except Firefox
        e.name === 'QuotaExceededError' ||
        // Firefox
        e.name === 'NS_ERROR_DOM_QUOTA_REACHED'
      ) &&
      // acknowledge QuotaExceededError only if there's something already stored
      (storage && storage.length !== 0)
    }
  }

// *********************************************************************************************************************
const restoreFromLocalStorage =
  tabName => {
    const trace_bnd = traceBoundary("restoreFromLocalStorage", tabName)
    const trace     = traceInfo("restoreFromLocalStorage")
    trace_bnd(true)

    let tabValueStr = window.localStorage.getItem(tabName)

    if (isNull(tabValueStr)) {
      trace(`No values for ${tabName} found in local storage`)
    }
    else {
      trace(`Cached values for tab "${tabName}" found in local storage`)
      let thisConfig = tabConfig[tabName]
  
      JSON.parse(tabValueStr).map((field, idx) => {
        trace(`     ${field.id}=${field.value}`)
        thisConfig[idx].setter(field.id, field.value)
      })
    }

    trace_bnd(false)
  }

// *********************************************************************************************************************
const writeToLocalStorage =
  tabName => {
    const trace_bnd = traceBoundary("writeToLocalStorage", tabName)
    const trace     = traceInfo("writeToLocalStorage")
    trace_bnd(true)

    let cacheVals = tabConfig[tabName].map(
      field =>
        isNullOrUndef(field.getter(field.id))
        ? { "id" : field.id, "value" : field.default }
        : { "id" : field.id, "value" : field.getter(field.id) }
      )

    trace(`Writing ${JSON.stringify(cacheVals)} to local storage`)
    window.localStorage.setItem(tabName, JSON.stringify(cacheVals))

    trace_bnd(false)
  }

// *********************************************************************************************************************
const clearLocalStorage =
  () => {
    const trace_bnd = traceBoundary("clearLocalStorage")
    trace_bnd(true)

    let key_count = Object.keys(tabConfig).length
    Object.keys(tabConfig).map(tab => window.localStorage.removeItem(tab))
    alert(`All cached data for ${key_count} tabs has been removed from local storage`)

    trace_bnd(false)
  }

// *********************************************************************************************************************
// Fetch the air temperature and pressure config values from local storage
const fetchConfigTabValues =
  () =>
    JSON
      .parse(window.localStorage.getItem("configuration"))
      // Force all field values to be strings otherwise Rust panics when unwrapping the results of the call to function
      // into_serde()
      .reduce((acc, field) => setProperty(acc, field.id, field.value + ""), {})

// *********************************************************************************************************************
// Public API
// *********************************************************************************************************************
export {
  storageAvailable
, restoreFromLocalStorage
, writeToLocalStorage
, clearLocalStorage
, fetchConfigTabValues
}
