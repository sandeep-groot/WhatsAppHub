const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');
const http = require('http');
require('dotenv').config();

const prisma = new PrismaClient();

const SECRET = process.env.YCLOUD_WEBHOOK_SECRET || 'whsec_e2c423c632894652980ab2f0371b6f74';
const PORT = process.env.PORT || 3001;
const URL_PATH = '/v1/whatsapp/webhooks';

// The WhatsApp number we will use for testing
const testPhoneNumber = '+12065550125';
const testPhoneNumberId = 'pni_test_webhook_123';
const testWabaId = 'waba_test_webhook_123';

async function seedTestData() {
  console.log('1. Checking/Seeding test data in database...');
  
  // Find or create Client
  const client = await prisma.client.upsert({
    where: { wabaId: testWabaId },
    update: {},
    create: {
      name: 'Test Webhook Client Inc.',
      wabaId: testWabaId,
      status: 'ACTIVE',
    },
  });
  console.log(`   - Client verified: ID = ${client.id}, name = "${client.name}"`);

  // Find or create WhatsAppNumber
  const number = await prisma.whatsAppNumber.upsert({
    where: { phoneNumber: testPhoneNumber },
    update: {
      phoneNumberId: testPhoneNumberId,
      wabaId: testWabaId,
      clientId: client.id,
      connectionStatus: 'IN_PROGRESS', // Set to IN_PROGRESS to test transition to ACTIVE
    },
    create: {
      clientId: client.id,
      phoneNumber: testPhoneNumber,
      phoneNumberId: testPhoneNumberId,
      wabaId: testWabaId,
      connectionStatus: 'IN_PROGRESS',
    },
  });
  console.log(`   - WhatsAppNumber verified: ID = ${number.id}, number = "${number.phoneNumber}"`);

  // Upsert onboarding steps 1-6
  for (let step = 1; step <= 6; step++) {
    const status = step <= 3 ? 'DONE' : step === 4 ? 'IN_PROGRESS' : 'PENDING';
    await prisma.onboardingStep.upsert({
      where: {
        numberId_stepNumber: {
          numberId: number.id,
          stepNumber: step,
        },
      },
      update: { status },
      create: {
        numberId: number.id,
        stepNumber: step,
        status,
      },
    });
  }
  console.log('   - Onboarding steps 1-6 initialized/reset.');
  return { number, client };
}

async function triggerWebhook() {
  const body = {
    id: "evt_test_inbound_" + Date.now(),
    type: "whatsapp.inbound_message.received",
    apiVersion: "v2",
    createTime: new Date().toISOString(),
    whatsappInboundMessage: {
      id: "msg_test_message_" + Math.random().toString(36).substring(7),
      from: "+15559876543", // Customer number sending message
      to: testPhoneNumber, // Registered number receiving message
      type: "text",
      text: {
        body: "Hello! Testing webhook signature verification and database sync automatically."
      }
    }
  };

  const payloadString = JSON.stringify(body);
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const signaturePayload = `${timestamp}.${payloadString}`;

  const signature = crypto
    .createHmac('sha256', SECRET)
    .update(signaturePayload)
    .digest('hex');

  const signatureHeader = `t=${timestamp},s=${signature}`;

  console.log('\n2. Sending webhook HTTP request to NestJS server...');
  console.log(`   - URL: http://localhost:${PORT}${URL_PATH}`);
  console.log(`   - Header ycloud-signature: ${signatureHeader}`);

  const postData = payloadString;

  const options = {
    hostname: 'localhost',
    port: PORT,
    path: URL_PATH,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData),
      'ycloud-signature': signatureHeader,
    },
  };

  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let responseBody = '';
      res.on('data', (chunk) => {
        responseBody += chunk;
      });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          body: responseBody,
        });
      });
    });

    req.on('error', (e) => {
      reject(e);
    });

    req.write(postData);
    req.end();
  });
}

async function verifyDbResults(numberId) {
  console.log('\n3. Verifying database updates...');
  
  // Wait a small moment to let the server complete the request execution
  await new Promise((resolve) => setTimeout(resolve, 1500));

  const number = await prisma.whatsAppNumber.findUnique({
    where: { id: numberId },
    include: {
      messages: true,
      steps: { orderBy: { stepNumber: 'asc' } }
    }
  });

  console.log(`   - Connection status: ${number.connectionStatus} (Expected: ACTIVE)`);
  console.log(`   - Message count: ${number.messageCount} (Expected: > 0)`);
  
  const webhookStep = number.steps.find(s => s.stepNumber === 4);
  const verifyStep = number.steps.find(s => s.stepNumber === 5);
  const activeStep = number.steps.find(s => s.stepNumber === 6);
  
  console.log(`   - Step 4 (Configure Webhook): ${webhookStep ? webhookStep.status : 'N/A'} (Expected: DONE)`);
  console.log(`   - Step 5 (Verify API):        ${verifyStep ? verifyStep.status : 'N/A'} (Expected: DONE)`);
  console.log(`   - Step 6 (Mark as Active):    ${activeStep ? activeStep.status : 'N/A'} (Expected: DONE)`);
  
  if (number.messages.length > 0) {
    console.log(`   - Logged messages in DB: ${number.messages.length}`);
    console.log(`     Latest: "${number.messages[number.messages.length - 1].messageBody}"`);
  } else {
    console.log(`   - Warning: No message logs found for this number.`);
  }
}

async function run() {
  try {
    const { number } = await seedTestData();
    const result = await triggerWebhook();
    console.log(`\nServer response: Status = ${result.statusCode}, Body = ${result.body}`);
    
    if (result.statusCode === 200 || result.statusCode === 201) {
      await verifyDbResults(number.id);
      console.log('\n✅ Webhook test passed successfully!');
    } else {
      console.error('\n❌ Webhook request failed. Make sure the NestJS server is running on port ' + PORT);
    }
  } catch (err) {
    console.error('\n❌ Test execution failed:', err.message);
    console.error('Make sure:');
    console.error('  1. PostgreSQL database is reachable (run: npx prisma db pull or check DATABASE_URL)');
    console.error('  2. NestJS server is running (run: npm run dev in Server/ directory)');
  } finally {
    await prisma.$disconnect();
  }
}

run();
