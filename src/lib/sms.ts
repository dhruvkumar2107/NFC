const FREE2SMS_API_KEY = process.env.FREE2SMS_API_KEY
const FREE2SMS_SENDER_ID = process.env.FREE2SMS_SENDER_ID
const FREE2SMS_API_URL = 'https://free2sms.com/api/v1/send'

interface OrderSMSData {
  orderId: string
  cardId: string | null
  design: string
  amount: number
  customerName: string
  customerEmail: string
  customerMobile: string
  baseUrl: string
}

export async function sendOrderConfirmationSMS(data: OrderSMSData): Promise<boolean> {
  if (!FREE2SMS_API_KEY || !FREE2SMS_SENDER_ID) {
    console.warn('Free2SMS not configured - skipping SMS')
    return false
  }

  const mobile = data.customerMobile?.replace(/[^0-9]/g, '')
  if (!mobile || mobile.length < 10) {
    console.warn('Invalid mobile number for SMS:', mobile)
    return false
  }

  const profileUrl = `${data.baseUrl}/p/${data.cardId || 'pending'}`
  const message =
    `MySmartCard Order Confirmed!\n\n` +
    `Order ID: ${data.orderId}\n` +
    `Card ID: ${data.cardId || 'Pending'}\n` +
    `Design: ${data.design}\n` +
    `Amount: Rs.${data.amount}\n` +
    `Status: Payment Received\n\n` +
    `Profile: ${profileUrl}\n\n` +
    `Login Credentials:\n` +
    `Email: ${data.customerEmail}\n` +
    `Password: ${data.customerEmail}_mysmartcard_temp\n\n` +
    `Thank you for your order!`

  try {
    const response = await fetch(FREE2SMS_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${FREE2SMS_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        numbers: [mobile],
        message,
        sender_id: FREE2SMS_SENDER_ID,
      }),
    })

    const result = await response.json()

    if (result.success) {
      console.log('SMS sent successfully to:', mobile)
      return true
    } else {
      console.error('SMS send failed:', result.message || result.error)
      return false
    }
  } catch (err: any) {
    console.error('SMS API error:', err.message)
    return false
  }
}
