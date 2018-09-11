const AWS = require('aws-sdk');
const crypto = require('crypto');
const spawn = require('child_process').spawn;
const s3 = new AWS.S3();
const fs = require('fs');
const parser = require('./parser');

// GITROB_ACCESS_TOKEN
const USERID = process.env.USERID;
const SESSIONID = process.env.SESSIONID;
const STAGEID = crypto.randomBytes(16).toString("hex");
const KEYID = '/users/' + USERID + '/' + USERID + '-' + SESSIONID + '-' + STAGEID;
const S3BUCKET = process.env.S3BUCKET;
const DEBUG = process.env.DEBUG;

var command_output = '';

console.log(process.env);
exec();

function save_to_s3(filename, contents) {
    console.log('Saving ' + filename + ' to s3');
    s3.createBucket({Bucket: S3BUCKET}, function(err, data) {
    if (err) {
        console.log(err);
    } else {
        params = {Bucket: S3BUCKET, Key: filename, Body: contents};
        s3.putObject(params, function(err, data) {
            if (err) {
                console.log(err)
            } else {
                console.log("Successfully uploaded data to " + S3BUCKET + " " + filename);
            }
        });
    }
    });
}

function exec() {
    console.log('Running command');
    const child = spawn('gitrob', ['-save','output.txt']);
    
    child.stdout.on('data', (data) => {
        if(DEBUG) {console.log(`stdout: ${data}`);}
        command_output += data;
    });
    child.stderr.on('data', (data) => {
        if(DEBUG) {console.log(`stderr: ${data}`);}
        command_output += data;
    });
    child.on('close', (code) => {
        console.log(`child process exited with code ${code}`);
        console.log('done');
        if(DEBUG) {console.log(command_output);}
        save_output();
    });
    child.on('exit', function(code, signal){
        console.log('child process exited with ' + `code ${code} and signal ${signal}`);
    });
} 

function save_output() {
    var data = fs.readFileSync(process.cwd() + '/output.txt');

    // parse the data into JSON acceptable format
    parsed_data = parser.parse(data);
    save_to_s3(KEYID + '.json', parsed_data);
}
