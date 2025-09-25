const swaggerSpecs = require('./swagger');

// Test function to validate Swagger configuration
function testSwaggerConfig() {
    console.log('Testing Swagger Configuration...\n');
    
    // Check if specs are generated
    if (!swaggerSpecs) {
        console.error('❌ Swagger specs are not generated');
        return false;
    }
    
    console.log('✅ Swagger specs generated successfully');
    
    // Check basic structure
    if (!swaggerSpecs.info) {
        console.error('❌ Missing info section');
        return false;
    }
    
    console.log('✅ Info section present');
    console.log(`   Title: ${swaggerSpecs.info.title}`);
    console.log(`   Version: ${swaggerSpecs.info.version}`);
    
    // Check paths
    if (!swaggerSpecs.paths) {
        console.error('❌ Missing paths section');
        return false;
    }
    
    const pathCount = Object.keys(swaggerSpecs.paths).length;
    console.log(`✅ Paths section present with ${pathCount} endpoints`);
    
    // Check components
    if (!swaggerSpecs.components) {
        console.error('❌ Missing components section');
        return false;
    }
    
    console.log('✅ Components section present');
    
    // Check schemas
    if (!swaggerSpecs.components.schemas) {
        console.error('❌ Missing schemas section');
        return false;
    }
    
    const schemaCount = Object.keys(swaggerSpecs.components.schemas).length;
    console.log(`✅ Schemas section present with ${schemaCount} schemas`);
    
    // Check security schemes
    if (!swaggerSpecs.components.securitySchemes) {
        console.error('❌ Missing security schemes section');
        return false;
    }
    
    console.log('✅ Security schemes section present');
    
    // List all endpoints
    console.log('\n📋 Available Endpoints:');
    Object.keys(swaggerSpecs.paths).forEach(path => {
        const methods = Object.keys(swaggerSpecs.paths[path]);
        methods.forEach(method => {
            const endpoint = swaggerSpecs.paths[path][method];
            console.log(`   ${method.toUpperCase()} ${path} - ${endpoint.summary || 'No summary'}`);
        });
    });
    
    // List all schemas
    console.log('\n📋 Available Schemas:');
    Object.keys(swaggerSpecs.components.schemas).forEach(schema => {
        console.log(`   ${schema}`);
    });
    
    console.log('\n✅ Swagger configuration test completed successfully!');
    console.log('\nTo view the documentation:');
    console.log('1. Start the server: npm start');
    console.log('2. Open: http://localhost:5000/api-docs');
    
    return true;
}

// Run the test
if (require.main === module) {
    testSwaggerConfig();
}

module.exports = { testSwaggerConfig }; 