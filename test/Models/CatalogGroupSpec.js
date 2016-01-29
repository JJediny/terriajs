'use strict';

/*global require,describe,it,expect,beforeEach*/
var CatalogGroup = require('../../lib/Models/CatalogGroup');
var CatalogItem = require('../../lib/Models/CatalogItem');
var createCatalogMemberFromType = require('../../lib/Models/createCatalogMemberFromType');
var Terria = require('../../lib/Models/Terria');

describe('CatalogGroup', function() {
    var terria;
    var group;
    beforeEach(function() {
        terria = new Terria({
            baseUrl: './'
        });
        group = terria.catalog.group;
        group.preserveOrder = false;
        createCatalogMemberFromType.register('group', CatalogGroup);
        createCatalogMemberFromType.register('item', CatalogItem);
    });

    it('sorts on load by default', function(done) {
        group.updateFromJson({
            type: 'group',
            items: [
                {
                    name: 'B',
                    type: 'group',
                    url: 'http://not.valid'
                },
                {
                    name: 'A',
                    type: 'group',
                    url: 'http://not.valid.either'
                }
            ]
        }).then(function() {
            expect(group.items.length).toBe(2);
            expect(group.items[0].name).toBe('A');
            expect(group.items[1].name).toBe('B');
            done();
        });
    });

    it('does not sort on load if preserveOrder is true', function(done) {
        group.updateFromJson({
            type: 'group',
            preserveOrder: true,
            items: [
                {
                    name: 'B',
                    type: 'group',
                    url: 'http://not.valid'
                },
                {
                    name: 'A',
                    type: 'group',
                    url: 'http://not.valid.either'
                }
            ]
        }).then(function() {
            expect(group.items.length).toBe(2);
            expect(group.items[0].name).toBe('B');
            expect(group.items[1].name).toBe('A');
            done();
        });
    });

    it('puts isPromoted items at the top when sorting', function(done) {
        group.updateFromJson({
            type: 'group',
            items: [
                {
                    name: 'B',
                    type: 'group',
                    url: 'http://not.valid'
                },
                {
                    name: 'A',
                    type: 'group',
                    url: 'http://not.valid.either'
                },
                {
                    name: 'C',
                    isPromoted: true,
                    type: 'group',
                    url: 'http://not.valid.either'
                }
            ]
        }).then(function() {
            expect(group.items.length).toBe(3);
            expect(group.items[0].name).toBe('C');
            expect(group.items[1].name).toBe('A');
            expect(group.items[2].name).toBe('B');
            done();
        });
    });

    it('puts isPromoted items at the top when preserving order', function(done) {
        group.updateFromJson({
            type: 'group',
            preserveOrder: true,
            items: [
                {
                    name: 'B',
                    type: 'group',
                    url: 'http://not.valid'
                },
                {
                    name: 'A',
                    type: 'group',
                    url: 'http://not.valid.either'
                },
                {
                    name: 'C',
                    isPromoted: true,
                    type: 'group',
                    url: 'http://not.valid.either'
                }
            ]
        }).then(function() {
            expect(group.items.length).toBe(3);
            expect(group.items[0].name).toBe('C');
            expect(group.items[1].name).toBe('B');
            expect(group.items[2].name).toBe('A');
            done();
        });
    });

    it('returns the names of its parents separated by / when uniqueId is called if no id present', function(done) {
        group.updateFromJson({
            type: 'group',
            name: 'A',
            items: [
                {
                    name: 'B',
                    type: 'group',
                    items: [
                        {
                            name: 'C',
                            type: 'group'
                        }
                    ]
                }
            ]
        }).then(function() {
            expect(group.items[0].items[0].uniqueId).toBe('A/B/C');
            expect(group.items[0].uniqueId).toBe('A/B');
            expect(group.uniqueId).toBe('A');
            done();
        });
    });

    describe('when updating items', function () {
        it('adds new items when onlyUpdateExistingItems isn\'t specified', function (done) {
            group.updateFromJson({
                type: 'group',
                items: [
                    {
                        name: 'A',
                        type: 'item'
                    },
                    {
                        name: 'B',
                        type: 'item'
                    },
                    {
                        name: 'C',
                        type: 'item'
                    }
                ]
            }).then(function () {
                expect(group.items[0].name).toBe('A');
                expect(group.items[1].name).toBe('B');
                expect(group.items[2].name).toBe('C');
                done();
            });
        });


        it('updates existing items by id ahead of name', function (done) {
            group.updateFromJson({
                type: 'group',
                items: [
                    {
                        name: 'A',
                        type: 'item'
                    },
                    {
                        name: 'B',
                        id: 'BUniqueId',
                        type: 'item'
                    }
                ]
            }).then(group.updateFromJson.bind(group, {
                items: [
                    {
                        name: 'C',
                        id: 'BUniqueId'
                    },
                    {
                        name: 'A'
                    }
                ]
            })).then(function () {
                expect(group.items[0].name).toBe('A');
                expect(group.items[1].uniqueId).toBe('BUniqueId');
                expect(group.items[1].name).toBe('C');
                expect(group.items.length).toBe(2);
                done();
            });
        });


        it('updates existing items by name', function (done) {
            group.updateFromJson({
                type: 'group',
                items: [
                    {
                        name: 'A',
                        type: 'item',
                        url: 'http://example.com/A'
                    },
                    {
                        name: 'B',
                        type: 'item',
                        url: 'http://example.com/B'
                    }
                ]
            }).then(group.updateFromJson.bind(group, {
                items: [
                    {
                        name: 'A',
                        url: 'http://test.com/A'
                    },
                    {
                        name: 'B',
                        url: 'http://test.com/B'
                    }
                ]
            })).then(function () {
                expect(group.items[0].url).toBe('http://test.com/A');
                expect(group.items[1].url).toBe('http://test.com/B');
                done();
            });
        });


        it('only updates existing items when onlyUpdateExistingItems === true', function (done) {
            group.updateFromJson({
                type: 'group',
                items: [
                    {
                        name: 'A',
                        type: 'item',
                        url: 'http://example.com/A'
                    }
                ]
            }).then(group.updateFromJson.bind(group, {
                items: [
                    {
                        name: 'A',
                        url: 'http://test.com/A'
                    },
                    {
                        name: 'B',
                        url: 'http://test.com/B'
                    }
                ]
            }, {
                onlyUpdateExistingItems: true
            })).then(function () {
                expect(group.items[0].url).toBe('http://test.com/A');
                expect(group.items.length).toBe(1);
                done();
            });
        });
    });

    it('adds new children to the catalog index', function() {
        var item1 = new CatalogItem(terria);
        item1.id = 'blah';

        group.add(item1);

        expect(terria.catalog.shareKeyIndex['blah']).toBe(item1);
    });

    describe('removes removed children from the catalog index', function() {
        it('when child has a specific id', function() {
            var item1 = new CatalogItem(terria);
            item1.id = 'blah';

            group.add(item1);
            group.remove(item1);

            expect(terria.catalog.shareKeyIndex['blah']).toBeUndefined();
        });

        it('when child has no id', function() {
            var item1 = new CatalogItem(terria);
            item1.name = 'blah';
            group.name = 'foo';

            group.add(item1);

            expect(terria.catalog.shareKeyIndex['foo/blah']).toBe(item1);

            group.remove(item1);

            expect(terria.catalog.shareKeyIndex['foo/blah']).toBeUndefined();
        });
    });
});
