const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres.weaisrpqcfphiskvbdel:Lasebobo%4010@aws-0-eu-west-1.pooler.supabase.com:5432/postgres?sslmode=require'
});
client.connect()
  .then(() => console.log('Connected!'))
  .then(() => client.query('SELECT COUNT(*) FROM "Location"'))
  .then(res => console.log('Locations count:', res.rows[0].count))
  .catch(err => console.error('Connection error', err))
  .finally(() => client.end());
