var Backbone = require('backbone');
var AnalysisDefinitionNodeModel = require('../../../../../javascripts/cartodb3/data/analysis-definition-node-model');
var RegionsCollection = require('../../../../../javascripts/cartodb3/data/data-observatory/regions-collection');
var cdb = require('cartodb.js');

describe('data/data-observatory/regions-collection', function () {
  var sqlExecuteBackup = cdb.SQL.prototype.execute;

  beforeEach(function () {
    var configModel = new Backbone.Model({
      base_url: '/u/foo',
      user_name: 'foo',
      sql_api_template: 'foo',
      api_key: 'foo'
    });

    this.nodeDefModel = new AnalysisDefinitionNodeModel({
      id: 'a1',
      type: 'data-observatory-multiple-measures',
      final_column: 'foo',
      source: 'a0'
    }, {
      configModel: configModel,
      collection: new Backbone.Collection()
    });

    this.nodeDefModel.queryGeometryModel = new Backbone.Model();
    this.nodeDefModel.queryGeometryModel.isFetched = function () { return true; };

    this.querySchemaModel = new Backbone.Model({
      query: 'select * from wadus'
    });

    var sourceNode = new Backbone.Model({
      type: 'source',
      table_name: 'wadus'
    });
    sourceNode.querySchemaModel = this.querySchemaModel;

    cdb.SQL.prototype.execute = function (query, vars, params) {
      params && params.success({
        rows: [
          {
            num_measurements: 2,
            region_id: 'section/tags.global',
            region_name: '"Global"'
          }, {
            num_measurements: 634,
            region_id: 'section/tags.united_states',
            region_name: '"United States"'
          }
        ]
      });
    };

    this.collection = new RegionsCollection([], {
      configModel: configModel,
      nodeDefModel: this.nodeDefModel
    });

    this.successCallback = jasmine.createSpy('successCallback');
    this.errorCallback = jasmine.createSpy('errorCallback');
  });

  afterEach(function () {
    cdb.SQL.prototype.execute = sqlExecuteBackup;
  });

  it('initial state', function () {
    expect(this.collection.getState()).toBe('unfetched');
  });

  it('format quotes', function () {
    this.collection.fetch();
    expect(this.collection.at(1).getName()).toBe('United States');
  });

  it('fetch', function () {
    this.collection.fetch({
      success: this.successCallback,
      error: this.errorCallback
    });

    expect(this.successCallback).toHaveBeenCalled();
    expect(this.collection.length).toBe(2);
    expect(this.collection.getState()).toBe('fetched');
  });

  it('model', function () {
    this.collection.fetch({
      success: this.successCallback,
      error: this.errorCallback
    });

    var m = this.collection.at(0);
    expect(m.getValue()).toBe('section/tags.global');
    expect(m.getName()).toBe('Global');
  });

  describe('setSelected', function () {
    beforeEach(function () {
      this.collection.fetch();
    });

    it('single value', function () {
      this.collection.setSelected('section/tags.united_states');
      expect(this.collection.at(1).get('selected')).toBe(true);
    });
  });

  it('getSelected', function () {
    this.collection.fetch();
    this.collection.setSelected('section/tags.united_states');
    var selected = this.collection.getSelectedItem();

    expect(selected.get('selected')).toBe(true);
    expect(selected.getValue()).toBe('section/tags.united_states');
    expect(selected.getName()).toBe('United States');
  });
});
