
var crypto = require('crypto'); 

exports.encryptPassword = function generatePass(password) { 
     
    // Creating a unique salt for a particular user 
       var saltKeyEncrypted = crypto.randomBytes(16).toString('hex'); 

       var encryptionDetails = {'saltKey': saltKeyEncrypted};
       var cryptoPass =   crypto.pbkdf2Sync(password, saltKeyEncrypted, 1000, 64, `sha512`).toString(`hex`);  
       encryptionDetails.passCrypto = cryptoPass;
     
       // Hashing user's salt and password with 1000 iterations, 
       return encryptionDetails;  
   }; 

// Method to check the entered password is correct or not 
exports.validatePassword = function decryptPass(password, storedHash, salt) { 

    var hash = crypto.pbkdf2Sync(password,  
        salt, 1000, 64, `sha512`).toString(`hex`); 
    return storedHash === hash; 
}; 

exports.adminRules = async function getRestrictions(connection){  
    const sql = "SELECT * FROM RESTRICTIONS";
    return await new Promise( (resolve,reject) => {
      var result = connection.query(sql,(err, rows, fields) =>{
        if(err){
          reject(err);
        }
        // and rows are accesable in then() 
        resolve(rows[0].securityCode);
     })
    })
}


exports.loginUser = async function getUser(connection, req){  
    let sql = `Select * from REGISTER where email = '${req.body.email}'`;
    return await new Promise( (resolve,reject) => {
      var result = connection.query(sql, function(err, results) {

        if(err){
          reject(err);
        } else {

        if (results.length > 0){
            var loginDetails = {'saltKey': results[0].salt};
            loginDetails.encryptedPass = results[0].encryptedPass;
            resolve(loginDetails);
        } else {
            reject(err);
        }        
    }
     });
    });
}
