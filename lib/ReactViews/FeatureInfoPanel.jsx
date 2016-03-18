'use strict';

import defined from 'terriajs-cesium/Source/Core/defined';
import FeatureInfoCatalogItem from './FeatureInfoCatalogItem.jsx';
import Loader from './Loader.jsx';
import ObserveModelMixin from './ObserveModelMixin';
import React from 'react';
import knockout from 'terriajs-cesium/Source/ThirdParty/knockout';

const FeatureInfoPanel = React.createClass({
    mixins: [ObserveModelMixin],
    propTypes: {
        terria: React.PropTypes.object,
        isVisible: React.PropTypes.bool,
        isCollapsed: React.PropTypes.bool,
        onClose: React.PropTypes.func,
        onChangeFeatureInfoPanelIsCollapsed: React.PropTypes.func
    },

    componentDidMount() {
        this._pickedFeaturesSubscription = knockout.getObservable(this.props.terria, 'pickedFeatures').subscribe(() => {
            this.props.terria.selectedFeature = undefined;

            const pickedFeatures = this.props.terria.pickedFeatures;
            if (defined(pickedFeatures.allFeaturesAvailablePromise)) {
                pickedFeatures.allFeaturesAvailablePromise.then(() => {
                    this.props.terria.selectedFeature = pickedFeatures.features.filter(featureHasInfo)[0];
                });
            }
        });
    },

    componentWillUnmount() {
        if (defined(this._pickedFeaturesSubscription)) {
            this._pickedFeaturesSubscription.dispose();
            this._pickedFeaturesSubscription = undefined;
        }
    },

    getFeatures() {
        if (defined(this.props.terria.pickedFeatures)) {
            return addSectionsForFeatures(this.props.terria);
        }
    },

    toggleOpenFeature(feature) {
        if (feature === this.props.terria.selectedFeature) {
            this.props.terria.selectedFeature = undefined;
        } else {
            this.props.terria.selectedFeature = feature;
        }
    },

    renderContent(pickedFeatures) {
        // Don't bother rendering anything for an invisible or collapsed panel.
        if (this.props.isCollapsed || !this.props.isVisible) {
            return undefined;
        }

        const that = this;
        if (defined(this.props.terria.pickedFeatures)) {
            if (this.props.terria.pickedFeatures.isLoading === true) {
                return <li><Loader/></li>;
            }
            if (pickedFeatures && pickedFeatures.length > 0) {
                return pickedFeatures.map((features, i)=>{
                    return (<FeatureInfoCatalogItem key={i}
                                                    features={features}
                                                    clock={that.props.terria.clock}
                                                    selectedFeature={this.props.terria.selectedFeature}
                                                    onClickFeatureHeader={this.toggleOpenFeature}
                            />);
                });
            }
            return <li className='no-results'> No results </li>;
        }
        return <li className='no-results'> No results </li>;
    },

    bringToFront() {
        //bring feature info panel to front
        this.props.viewState.switchComponentOrder(this.props.viewState.componentOrderOptions.featureInfoPanel);
    },

    render() {
        const pickedFeatures = this.getFeatures();
        return (
            <div className={`feature-info-panel ${this.props.viewState.componentOnTop === this.props.viewState.componentOrderOptions.featureInfoPanel ? 'is-top' : ''} ${this.props.isCollapsed ? 'is-collapsed' : ''} ${this.props.isVisible ? 'is-visible' : ''}`}
                aria-hidden={!this.props.isVisible}
                onClick={this.bringToFront} >
              <div className='feature-info-panel__header'>
                <button onClick={ this.props.onChangeFeatureInfoPanelIsCollapsed } className='btn'> Feature Info Panel </button>
                <button onClick={ this.props.onClose } className="btn btn--close-feature" title="Close data panel"></button>
              </div>
              <ul className="feature-info-panel__body">{this.renderContent(pickedFeatures)}</ul>
            </div>
            );
    }
});

// to add multiple catalog when several dataset turned on at the same time
function addSectionsForFeatures(terria) {
    const features = terria.pickedFeatures.features;
    const sections = [];
    const sectionMap = new Map();

    features.forEach((feature)=> {
        if (!defined(feature.position)) {
            feature.position = terria.pickedFeatures.pickPosition;
        }

        const catalogItem = calculateCatalogItem(terria.nowViewing, feature);

        // if feature does not have a catalog item?
        if (!defined(catalogItem)) {
            sections.push({
                catalogItem: undefined,
                feature: feature
            });
        } else {
            let section = sectionMap.get(catalogItem);
            if (!defined(section)) {
                section = {
                    catalogItem: catalogItem,
                    features: []
                };
                sections.push(section);
                sectionMap.set(catalogItem, section);
            }

            section.features.push(feature);
        }
    });

    return sections;
}

function calculateCatalogItem(nowViewing, feature) {
    // some data sources (czml, geojson, kml) have an entity collection defined on the entity
    // (and therefore the feature)
    // then match up the data source on the feature with a now-viewing item's data source
    let result;
    let i;
    if (!defined(nowViewing)) {
        // so that specs do not need to define a nowViewing
        return undefined;
    }
    if (defined(feature.entityCollection) && defined(feature.entityCollection.owner)) {
        const dataSource = feature.entityCollection.owner;
        for (i = nowViewing.items.length - 1; i >= 0; i--) {
            if (nowViewing.items[i].dataSource === dataSource) {
                result = nowViewing.items[i];
                break;
            }
        }
        return result;
    }
    // If there is no data source, but there is an imagery layer (eg. ArcGIS)
    // we can match up the imagery layer on the feature with a now-viewing item.
    if (defined(feature.imageryLayer)) {
        const imageryLayer = feature.imageryLayer;
        for (i = nowViewing.items.length - 1; i >= 0; i--) {
            if (nowViewing.items[i].imageryLayer === imageryLayer) {
                result = nowViewing.items[i];
                break;
            }
        }
        return result;
    }
    // otherwise, no luck
    return undefined;
}

function featureHasInfo(feature) {
    return (defined(feature.properties) || defined(feature.description));
}

module.exports = FeatureInfoPanel;
