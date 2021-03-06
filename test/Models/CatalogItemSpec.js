'use strict';

/*global require*/
var CatalogItem = require('../../lib/Models/CatalogItem');
var CatalogGroup = require('../../lib/Models/CatalogGroup');
var Catalog = require('../../lib/Models/Catalog');
var Terria = require('../../lib/Models/Terria');
var createCatalogMemberFromType = require('../../lib/Models/createCatalogMemberFromType');

describe('CatalogItem', function () {
    var terria;
    var item;
    beforeEach(function () {
        terria = new Terria({
            baseUrl: './'
        });
        item = new CatalogItem(terria);
        createCatalogMemberFromType.register('group', CatalogGroup);
        createCatalogMemberFromType.register('item', CatalogItem);
    });

    it('uses the url as the direct dataUrl', function () {
        item.url = 'http://foo.bar';

        expect(item.dataUrlType).toBe('direct');
        expect(item.dataUrl).toBe('http://foo.bar');

        item.url = 'http://something.else';
        expect(item.dataUrlType).toBe('direct');
        expect(item.dataUrl).toBe('http://something.else');
    });

    it('explicit dataUrl and dataUrlType overrides using url', function () {
        item.url = 'http://foo.bar';
        item.dataUrl = 'http://something.else';
        item.dataUrlType = 'wfs';

        expect(item.dataUrl).toBe('http://something.else');
        expect(item.dataUrlType).toBe('wfs');

        // Make sure setting the url again doesn't override the explicitly-set dataUrl.
        item.url = 'http://hello.there';
        expect(item.dataUrl).toBe('http://something.else');
        expect(item.dataUrlType).toBe('wfs');
    });

    describe('time series data: ', function() {
        beforeEach(function () {
            spyOn(terria.timeSeriesStack, 'addLayerToTop');
            spyOn(terria.timeSeriesStack, 'removeLayer');
        });

        describe('when item has clock', function() {
            beforeEach(function() {
               item.clock = {
                   getValue: jasmine.createSpy('getValue')
               };
            });

            it('item should be added to top of timeSeriesStack when enabled', function(done) {
                item.isEnabled = true;

                item._loadForEnablePromise.then(function() {
                   expect(terria.timeSeriesStack.addLayerToTop).toHaveBeenCalledWith(item);
                   done();
                });
            });

            it('should be removed from timeSeriesStack when disabled', function(done) {
                item.isEnabled = true;

                item._loadForEnablePromise.then(function() {
                    item.isEnabled = false;
                    expect(terria.timeSeriesStack.removeLayer).toHaveBeenCalledWith(item);
                    done();
                });
            });

        });

        describe('when item has no clock', function() {
           it('should not call timeSeriesStack', function(done) {
               item.isEnabled = true;

               item._loadForEnablePromise.then(function() {
                   expect(terria.timeSeriesStack.addLayerToTop).not.toHaveBeenCalled();
                   done();
               });
           });
        });
    });

    describe('ids', function () {
        var catalog;

        beforeEach(function (done) {
            catalog = new Catalog(terria);

            catalog.updateFromJson([
                {
                    name: 'Group',
                    type: 'group',
                    items: [
                        {
                            name: 'A',
                            type: 'item'
                        },
                        {
                            name: 'B',
                            id: 'thisIsAnId',
                            type: 'item'
                        },
                        {
                            name: 'C',
                            type: 'item',
                            shareKeys: ['Another/Path']
                        },
                        {
                            name: 'D',
                            id: 'thisIsAnotherId',
                            shareKeys: ['This/Is/A/Path', 'aPreviousId'],
                            type: 'item'
                        }
                    ]
                }
            ]).then(done);
        });

        describe('uniqueId', function () {
            it('should return path if no id is specified', function () {
                expect(catalog.group.items[0].items[0].uniqueId).toBe('Root Group/Group/A');
            });

            it('should return id field if one is specified', function () {
                expect(catalog.group.items[0].items[1].uniqueId).toBe('thisIsAnId');
            });
        });

        describe('allShareKeys', function () {
            it('should return just the path if no id or shareKeys are specified', function() {
                expect(catalog.group.items[0].items[0].allShareKeys).toEqual(['Root Group/Group/A']);
            });

            it('should return just the id if id but no shareKeys are specified', function() {
                expect(catalog.group.items[0].items[1].allShareKeys).toEqual(['thisIsAnId']);
            });

            it('should return the path and shareKeys if no id specified', function() {
                expect(catalog.group.items[0].items[2].allShareKeys).toEqual(['Root Group/Group/C', 'Another/Path']);
            });

            it('should return the id and shareKeys if id specified', function() {
                expect(catalog.group.items[0].items[3].allShareKeys).toEqual(['thisIsAnotherId', 'This/Is/A/Path', 'aPreviousId']);
            });
        });
    });

    describe('setting isEnabled', function() {
        beforeEach(function() {
            item.nowViewingCatalogItem = {};
            spyOn(terria, 'disclaimerListener');
        });

        describe('to true when item has a disclaimer', function() {
            beforeEach(function() {
                item.initialMessage = {};
                item.isEnabled = true;
            });

            it('triggers a disclaimerEvent', function() {
                expect(terria.disclaimerListener.calls.argsFor(0)[0]).toBe(item);
            });

            it('doesn\'t immediately finish enabling the view', function() {
                expect(item.nowViewingCatalogItem.isEnabled).not.toBe(true);
            });

            it('finishes enabling the view after the callback passed to disclaimerEvent is executed', function(done) {
                terria.disclaimerListener.calls.argsFor(0)[1]();
                item._loadForEnablePromise.then(function() {
                    expect(item.nowViewingCatalogItem.isEnabled).toBe(true);
                }).then(done).otherwise(fail);
            });
        });

        describe('to true when item has no disclaimer', function() {
            beforeEach(function() {
                item.isEnabled = true;
            });

            it('triggers no disclaimerEvent', function() {
                expect(terria.disclaimerListener).not.toHaveBeenCalled();
            });

            it('finishes enabling the view', function(done) {
                item._loadForEnablePromise.then(function() {
                    expect(item.nowViewingCatalogItem.isEnabled).toBe(true);
                }).then(done).otherwise(fail);
            });
        });
    });
});
