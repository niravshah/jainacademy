var config = [];

config['dev'] = {
    mongoUrl: 'mongodb://mongodb/' + process.env.MONGODB_DATABASE
};

config['int'] = {
    mongoUrl: 'mongodb://mongodb/' + process.env.MONGODB_DATABASE
};


module.exports = config;