/*
*
*
*       FILL IN EACH FUNCTIONAL TEST BELOW COMPLETELY
*       -----[Keep the tests in the same order!]-----
*       (if additional are added, keep them at the very end!)
*/

var chaiHttp = require('chai-http');
var chai = require('chai');
var assert = chai.assert;
var server = require('../server');

chai.use(chaiHttp);

const insertTestIssue = (cb) => {
  chai.request(server)
    .post('/api/issues/test')
    .send({
      issue_title: 'Test issue ' + (Math.random() * 100).toFixed(0),
      issue_text: 'test issue body text',
      created_by: 'Functional Test',
    })
    .end(cb);
};

suite('Functional Tests', function() {
  
    suite('POST /api/issues/{project} => object with issue data', function() {
      
      test('Every field filled in', function(done) {
       chai.request(server)
        .post('/api/issues/test')
        .send({
          issue_title: 'Title',
          issue_text: 'text',
          created_by: 'Functional Test - Every field filled in',
          assigned_to: 'Chai and Mocha',
          status_text: 'In QA'
        })
        .end(function(err, res){
          assert.equal(res.status, 200);
          assert.property(res.body, '_id');
          assert.equal(res.body.issue_title, 'Title');
          assert.equal(res.body.issue_text, 'text');
          assert.equal(res.body.created_by, 'Functional Test - Every field filled in');
          assert.equal(res.body.assigned_to, 'Chai and Mocha');
          assert.equal(res.body.status_text, 'In QA');
          assert.property(res.body, 'created_on');
          assert.property(res.body, 'updated_on');
          assert.property(res.body, 'open');
          done();
        });
      });
      
      test('Required fields filled in', function(done) {
        chai.request(server)
        .post('/api/issues/test')
        .send({
          issue_title: 'Requireds only',
          issue_text: 'the body text',
          created_by: 'Functional Test - Required fields filled in',
        })
        .end(function(err, res){
          assert.equal(res.status, 200);          
          assert.property(res.body, '_id');
          assert.equal(res.body.issue_title, 'Requireds only');
          assert.equal(res.body.issue_text, 'the body text');
          assert.equal(res.body.created_by, 'Functional Test - Required fields filled in');
          assert.equal(res.body.assigned_to, null);
          assert.equal(res.body.status_text, null);
          assert.property(res.body, 'created_on');
          assert.property(res.body, 'updated_on');
          assert.property(res.body, 'open');
          done();
        });
      });
      
      test('Missing required fields', function(done) {
        chai.request(server)
        .post('/api/issues/test')
        .send({ issue_title: 'Requireds only', })
        .end(function(err, res){
          assert.equal(res.status, 400);
          assert.equal(res.body, 'ERROR: Missing required fields');
          done();
        });
      });
      
    });
    
    suite('PUT /api/issues/{project} => text', function() {
      
      test('No body', function(done) {
        chai.request(server)
        .put('/api/issues/test')
        .send({})
        .end(function(err, res){
          assert.equal(res.status, 400);
          assert.equal(res.body, 'ERROR: Issue _id is required');
          done();
        });
      });
      
      test('One field to update', function(done) {
        insertTestIssue((err, res) => {
          chai.request(server)
          .put('/api/issues/test')
          .send({_id: res.body._id, assigned_to: 'Alex Parra'})
          .end(function(err, res){
            assert.equal(res.status, 200);
            assert.equal(res.body, 'successfully updated');
            done();
          });
        });
      });
      
      test('Multiple fields to update', function(done) {
        insertTestIssue((err, res) => {
          chai.request(server)
          .put('/api/issues/test')
          .send({
            _id: res.body._id, 
            assigned_to: 'Alex Parra', 
            status_text: 'Handle ASAP',
          })
          .end(function(err, res){
            assert.equal(res.status, 200);
            assert.equal(res.body, 'successfully updated');
            done();
          });
        });
      });
      
    });
    
    suite('GET /api/issues/{project} => Array of objects with issue data', function() {
      
      test('No filter', function(done) {
        chai.request(server)
        .get('/api/issues/test')
        .query({})
        .end(function(err, res){
          assert.equal(res.status, 200);
          assert.isArray(res.body);
          assert.property(res.body[0], 'issue_title');
          assert.property(res.body[0], 'issue_text');
          assert.property(res.body[0], 'created_on');
          assert.property(res.body[0], 'updated_on');
          assert.property(res.body[0], 'created_by');
          assert.property(res.body[0], 'assigned_to');
          assert.property(res.body[0], 'open');
          assert.property(res.body[0], 'status_text');
          assert.property(res.body[0], '_id');
          done();
        });
      });
      
      test('One filter', function(done) {
        insertTestIssue((err, res) => {
          chai.request(server)
          .get('/api/issues/test')
          .query({ created_by: 'Functional Test' })
          .end(function(err, res){
            assert.equal(res.status, 200);
            assert.isArray(res.body);
            assert.equal(res.body[0].created_by, 'Functional Test');
            done();
          });
        });
      });
      
      test('Multiple filters (test for multiple fields you know will be in the db for a return)', function(done) {
        insertTestIssue((err, res) => {
          chai.request(server)
          .get('/api/issues/test')
          .query({ created_by: 'Functional Test', open: 1 })
          .end(function(err, res){
            assert.equal(res.status, 200);
            assert.isArray(res.body);
            assert.equal(res.body[0].created_by, 'Functional Test');
            assert.equal(res.body[0].open, true);
            done();
          });
        });
      });
      
    });
    
    suite('DELETE /api/issues/{project} => text', function() {
      
      test('No _id', function(done) {
        chai.request(server)
        .delete('/api/issues/test')
        .send({})
        .end(function(err, res){
          assert.equal(res.status, 400);
          assert.equal(res.body, '_id error');
          done();
        });
      });
      
      test('Valid _id', function(done) {
        insertTestIssue((err, res) => {
          const { _id } = res.body;
          chai.request(server)
          .delete('/api/issues/test')
          .send({_id})
          .end(function(err, res){
            assert.equal(res.status, 200);
            assert.equal(res.body, 'deleted '+ _id);
            done();
          });
        });
      });
      
    });

});
