'use strict';

/*global require*/
var when = require('terriajs-cesium/Source/ThirdParty/when');
var VarType = require('../Map/VarType');
var DeveloperError = require('terriajs-cesium/Source/Core/DeveloperError');
var URI = require('urijs');
var loadJson = require('terriajs-cesium/Source/Core/loadJson');

/*
If TableStructure has address column, adds two new columns: lat and long.
It must call a geocoding service to determine the lat and long coordinates for a given address.
*/

/**
 * Instantiate an address converter with a TableStructure that it must convert.
 *
 * @alias AddressConverter
 * @constructor
 * @param {TableStructure} A tableStructure that contains an address column.
 */
var AddressConverter = function(tableStructure) {
    /**
     * TableStructure containing data loaded in from csv, including an address column
     * @type {TableStructure}
     */
    this.tableStructure = tableStructure;

    /**
     * URL for geocoder service.
     * @type {String}
     */
    this.geocoderUrl = "https://search.mapzen.com/v1/search";
};

/**
 * Convert addresses one at a time, making multiple calls to the server. For some geocoding services, this is all they
 * provide. When the promise fulfills, the tableStructure has been updated with new lat and lon columns.
 *
 * @return {Promise} Promise with no return value.
 */
AddressConverter.prototype.convertEachAddress = function() {

    if (!this.tableStructure.hasAddress)
    {
        throw new DeveloperError('This tableStructure has no addresses!');
    }

    var addressesCol = this.tableStructure.columnsByType[VarType.ADDR][0];
    if (addressesCol.length === 0)
    {
        throw new DeveloperError('Even though the tableStructure reports it has an address column, it has no addresses!');
    }

    var that = this;
    var promises = addressesCol.values.map(function(address) { return convertAddress(address, that.geocoderUrl); });
    return when.all(promises).then( function(results) {
        var longValues = results.map(function(latLong) { return latLong[0]; });
        that.tableStructure.addColumn("Lon", longValues);

        var latValues = results.map(function(latLong) { return latLong[1]; });
        that.tableStructure.addColumn("Lat", latValues);
        return when(true);
    }).otherwise(function(e) {
        console.log("Unable to create lat and lon columns for TableStructure.");
    });
};

/**
 * A promise to convert a single address to lat long coordinates, which resolves to
 * a length two array with (longitude, latitude) coordinates.
 *
 * @param {String} address The address to convert
 * @param {String} geocoderUrl URL of the geocoder service
 *
 * @return {Promise} A promise that eventually returns a pair of coordinates.
 */
function convertAddress(address, geocoderUrl) {

    var baseuri = URI(geocoderUrl).addQuery({
        text: address,
        api_key: "search-wEPIcrU",
        "boundary.country": "AU",
        sources: "oa",
        size: 1
    });

    return loadJson(baseuri.toString()).then(function(json) {
        return json.features[0].geometry.coordinates;
    }).otherwise(function(e) {
        console.log("Error retrieving lat-long coordinates for address.", e);
    });
}

module.exports = AddressConverter;
