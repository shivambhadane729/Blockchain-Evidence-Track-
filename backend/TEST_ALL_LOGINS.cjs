const axios = require('axios');

class LoginTester {
    constructor() {
        this.baseURL = 'http://localhost:3001/api/auth/login';
        this.testUsers = [
            {
                name: 'Field/Investigating Officer',
                email: 'officer.rajesh@police.gov.in',
                password: 'officer123',
                role: 'evidence-officer',
                expectedDashboard: 'Officer Dashboard'
            },
            {
                name: 'Station House Officer (SHO)',
                email: 'sho.vikram@police.gov.in',
                password: 'sho123',
                role: 'station-house-officer',
                expectedDashboard: 'SHO Dashboard'
            },
            {
                name: 'Evidence Custodian',
                email: 'custodian.priya@police.gov.in',
                password: 'custodian123',
                role: 'evidence-custodian',
                expectedDashboard: 'Custodian Dashboard'
            },
            {
                name: 'Forensic Lab Manager',
                email: 'manager.dr.singh@lab.gov.in',
                password: 'manager123',
                role: 'forensic-lab-manager',
                expectedDashboard: 'Analyst Dashboard'
            },
            {
                name: 'Forensic Lab Technician',
                email: 'tech.sneha@lab.gov.in',
                password: 'tech123',
                role: 'forensic-lab-technician',
                expectedDashboard: 'Analyst Dashboard'
            },
            {
                name: 'Court Clerk',
                email: 'clerk.anita@court.gov.in',
                password: 'clerk123',
                role: 'court-clerk',
                expectedDashboard: 'Prosecutor Dashboard'
            },
            {
                name: 'Judge/Magistrate',
                email: 'judge.sharma@court.gov.in',
                password: 'judge123',
                role: 'judge-magistrate',
                expectedDashboard: 'Judge Dashboard'
            },
            {
                name: 'System Administrator',
                email: 'admin@ndep.gov.in',
                password: 'admin123',
                role: 'system-admin',
                expectedDashboard: 'Admin Dashboard'
            }
        ];
    }

    async testAllLogins() {
        console.log('🧪 Testing All User Logins...\n');
        console.log('=' * 60);
        
        let successCount = 0;
        let failCount = 0;

        for (const user of this.testUsers) {
            try {
                console.log(`\n🔐 Testing: ${user.name}`);
                console.log(`   Email: ${user.email}`);
                console.log(`   Role: ${user.role}`);
                
                const response = await axios.post(this.baseURL, {
                    email: user.email,
                    password: user.password,
                    role: user.role,
                    otp: '123456'
                });

                if (response.status === 200) {
                    console.log(`   ✅ LOGIN SUCCESS`);
                    console.log(`   🎯 Dashboard: ${user.expectedDashboard}`);
                    console.log(`   👤 User: ${response.data.user.name}`);
                    console.log(`   🔑 Token: ${response.data.token ? 'Received' : 'Missing'}`);
                    successCount++;
                } else {
                    console.log(`   ❌ LOGIN FAILED - Status: ${response.status}`);
                    failCount++;
                }

            } catch (error) {
                console.log(`   ❌ LOGIN FAILED`);
                if (error.response) {
                    console.log(`   📋 Error: ${error.response.data.error}`);
                    console.log(`   🔢 Code: ${error.response.data.code}`);
                } else {
                    console.log(`   📋 Error: ${error.message}`);
                }
                failCount++;
            }
        }

        console.log('\n' + '=' * 60);
        console.log('📊 LOGIN TEST RESULTS:');
        console.log(`   ✅ Successful: ${successCount}/${this.testUsers.length}`);
        console.log(`   ❌ Failed: ${failCount}/${this.testUsers.length}`);
        
        if (successCount === this.testUsers.length) {
            console.log('\n🎉 ALL LOGINS WORKING PERFECTLY!');
            console.log('✅ Ready for frontend testing');
        } else {
            console.log('\n⚠️ Some logins failed - check the errors above');
        }

        console.log('\n📋 LOGIN CREDENTIALS SUMMARY:');
        console.log('=' * 60);
        this.testUsers.forEach((user, index) => {
            console.log(`${index + 1}. ${user.name}`);
            console.log(`   Email: ${user.email}`);
            console.log(`   Password: ${user.password}`);
            console.log(`   Role: ${user.role}`);
            console.log(`   Dashboard: ${user.expectedDashboard}`);
            console.log('');
        });
    }
}

// Run the test
const tester = new LoginTester();
tester.testAllLogins().catch(console.error);
