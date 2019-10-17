/*
*
*
*       Complete the API routing below
*
*
*/

'use strict';

var expect = require('chai').expect;
const mongo       = require('mongodb').MongoClient;
const ObjectId = require('mongodb').ObjectID;


module.exports = function (app) {

  mongo.connect(process.env.DB, (err, client) => {
    if(err) {
      console.log('Database error: ' + err);
      return;
    }
    
    console.log('Successful database connection');
    const db = client.db('node-issue-tracker');

    app.route('/api/issues/:project')

      .get(async (req, res) => {
        const project = req.params.project;
        if( !project ) return res.status(400).json('ERROR: Project name required');
      
        const proj = await db.collection('projects').findOne({name: project});
        if( !proj ) return res.status(404).json('ERROR: Project not found: '+ project);

        const issues = await db.collection('issues').find({project: ObjectId(proj._id)}).toArray();
        
        const { issue_title, issue_text, created_by, assigned_to, status_text, open } = req.query;
        
        const filteredIssues = issues.filter(issue => {
          let match = true;
          if( issue_title && issue.issue_title !== issue_title ) match = false;
          if( issue_text && issue.issue_text !== issue_text ) match = false;
          if( created_by && issue.created_by !== created_by ) match = false;
          if( assigned_to && issue.assigned_to !== assigned_to ) match = false;
          if( status_text && issue.status_text !== status_text ) match = false;
          if( open != null && issue.open !== !!Number(open) ) match = false;
          return match;
        });
      
        return res.json(filteredIssues);
      })

      .post(async (req, res) => {
        const { project } = req.params;
        if( !project ) return res.status(400).json('Project name required');
            
        const projectFind = await db.collection('projects').findOneAndUpdate(
            { name: project },
            { $setOnInsert: { name: project, created_on: new Date() }, },
            { upsert:true, returnOriginal:false }
          );
      
        if( projectFind.ok !== 1 ) return res.status(500).json('ERROR: Failed to create project '+ project);
      
        const proj = projectFind.value;
        const { issue_title, issue_text, created_by, assigned_to, status_text } = req.body;
      
        if( !issue_title || !issue_text || !created_by ) return res.status(400).json('ERROR: Missing required fields');
      
        const issueInsert = await db.collection('issues').insertOne({ 
              project: proj._id,
              issue_title,
              issue_text,
              created_by,
              assigned_to: assigned_to || null,
              status_text: status_text || null,
              created_on: new Date(),
              updated_on: new Date(),
              open: true,
            });
        
        if( issueInsert.insertedCount === 1 ) return res.json(issueInsert.ops[0]);
        return res.status(500).json('ERROR: Failed to insert issue');
      })

      .put(async (req, res) => {
        const project = req.params.project;
        if( !project ) return res.status(400).json('ERROR: Project name required');
        
        const { _id, issue_title, issue_text, created_by, assigned_to, status_text, open } = req.body;
        if( !_id ) return res.status(400).json('ERROR: Issue _id is required');
      
        if( !issue_title && !issue_text && !created_by && !assigned_to && !status_text && open == null ) {
          return res.status(400).json('no updated field sent');  
        }
      
        const updates = {
          updated_on: new Date(),
        };
        
        if( issue_title ) updates.issue_title = issue_title;
        if( issue_text ) updates.issue_text = issue_text;
        if( created_by ) updates.created_by = created_by;
        if( assigned_to ) updates.assigned_to = assigned_to;
        if( status_text ) updates.status_text = status_text;
        if( Number(open) === 1 ) updates.open = false;
        
        const issueUpdate = await db.collection('issues').findOneAndUpdate(
            { _id: ObjectId(req.body._id) },
            { $set: updates, },
            { returnOriginal:false }
          );
    
        if( issueUpdate.ok !== 1 ) return res.status(500).json('could not update '+ _id);
        return res.json('successfully updated');
      })

      .delete(async (req, res) => {
        const project = req.params.project;
        const { _id } = req.body;
        if( ! _id ) return res.status(400).json('_id error');

        const r = await db.collection('issues').deleteOne({ _id: ObjectId(_id) });
        if( r.deletedCount !== 1 ) return res.status(500).json('could not delete '+ _id);
        return res.json('deleted '+ _id);
      });


    //404 Not Found Middleware
    app.use(function(req, res, next) {
      res.status(404)
        .type('text')
        .send('Not Found');
    });


  });
};
