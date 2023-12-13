'use strict';
const router = require('express').Router();

const WhatsappCloudAPI = require('whatsappcloudapi_wrapper');

const Whatsapp = new WhatsappCloudAPI({
    accessToken: process.env.Meta_WA_accessToken,
    senderPhoneNumberId: process.env.Meta_WA_SenderPhoneNumberId,
    WABA_ID: process.env.Meta_WA_wabaId,
});

const EcommerceStore = require('./../utils/ecommerce_store.js');
let Store = new EcommerceStore();
const CustomerSession = new Map();

router.get('/meta_wa_callbackurl', (req, res) => {
    try {
        console.log('GET: Someone is pinging me!');

        let mode = req.query['hub.mode'];
        let token = req.query['hub.verify_token'];
        let challenge = req.query['hub.challenge'];

        if (
            mode &&
            token &&
            mode === 'subscribe' &&
            process.env.Meta_WA_VerifyToken === token
        ) {
            return res.status(200).send(challenge);
        } else {
            return res.sendStatus(403);
        }
    } catch (error) {
        console.error({ error });
        return res.sendStatus(500);
    }
});

router.post('/meta_wa_callbackurl', async (req, res) => {
    console.log('POST: Someone is pinging me!');
    try {
        let data = Whatsapp.parseMessage(req.body);

        if (data?.isMessage) {
            let incomingMessage = data.message;
            let recipientPhone = incomingMessage.from.phone; // extract the phone number of sender
            let recipientName = incomingMessage.from.name;
            let typeOfMsg = incomingMessage.type; // extract the type of message (some are text, others are images, others are responses to buttons etc...)
            let message_id = incomingMessage.message_id; // extract the message id

            // Start of cart logic
            if (!CustomerSession.get(recipientPhone)) {
                CustomerSession.set(recipientPhone, {
                    cart: [],
                });
            }

            if (typeOfMsg === 'text_message') {
                console.log("ooooooooooooooooo")
                
                let incomingMessageContent = incomingMessage.text.body;
                
                const word0 = 'Hi'
                const word1 = 'operating'
                const word2 = 'electronics'
                const word3 = 'lost'
                const word4 = 'promotion'
                const word5 = 'promotions'
                console.log(incomingMessageContent.toLowerCase().includes(word0.toLowerCase()))
                if (incomingMessageContent.toLowerCase().includes(word0.toLowerCase())) {
                    console.log(`The word "${word0}" is included in the string.`);
                    await Whatsapp.sendText({
                        message: `Hey ${recipientName}, \nYou are chatting with *MadaHill* chatbot.\nI can provide information on:\n*⌚Operating hours* \n*🛒List of stores* \n*🤩Special offers* \n*🌟Upcoming events*\nI can also send you regular updates about:\n*📍New store openings* \n*🏷️Discounts* \n*🤩Promotions* \n*✅And any changes in the mall's services*`,
                        recipientPhone: recipientPhone
                    });
                }else if (incomingMessageContent.toLowerCase().includes(word1.toLowerCase())) {
                    console.log(`The word "${word1}" is included in the string.`);
                    await Whatsapp.sendText({
                        message: `Hello! The mall is open from *08AM to 9PM* from *Monday to Sunday*. However, please note that some stores may have slightly different operating hours. Let me know if you need more information about any specific store or event.
                        `,
                        recipientPhone: recipientPhone
                    });
                  } else if(incomingMessageContent.toLowerCase().includes(word2.toLowerCase())) {
                    console.log(`The word "${word2}" is not included in the string.`);
                    await Whatsapp.sendText({
                        message: `For electronics 💻📱, you can visit our stores like *Telefonika* and *Game*. Let me know if you want more details about any specific store.`,
                        recipientPhone: recipientPhone
                    });
                  } else if(incomingMessageContent.toLowerCase().includes(word3.toLowerCase())){
                    console.log(`The word "${word3}" is not included in the string.`)
                    await Whatsapp.sendText({
                    message: ` Yes, we have a dedicated lost and found service. If you have lost something, please visit the mall's information desk on the ground floor. They will assist you in locating your lost item or provide further instructions. Is there anything else I can help you with?`,
                    recipientPhone: recipientPhone
                        });
                  }else if(incomingMessageContent.toLowerCase().includes(word4.toLowerCase())){
                    console.log(`The word "${word4}" is not included in the string.`)
                    await Whatsapp.sendImage({recipientPhone: recipientPhone, caption: '*Game Store* is having a promotion🌟🌟🤩',url: 'https://guzzle.akamaized.net/media/thumbnails/catalogues/14846_Zambia_P1_6013470001.jpg.900x10000_q75.jpg'}) 
                  }
                
            }

            if (typeOfMsg === 'radio_button_message') {
                let selectionId = incomingMessage.list_reply.id;

                if (selectionId.startsWith('product_')) {
                    let product_id = selectionId.split('_')[1];
                    let product = await Store.getProductById(product_id);
                    const {
                        price,
                        title,
                        description,
                        category,
                        image: imageUrl,
                        rating,
                    } = product.data;

                    let emojiRating = (rvalue) => {
                        rvalue = Math.floor(rvalue || 0); // generate as many star emojis as whole ratings
                        let output = [];
                        for (var i = 0; i < rvalue; i++) output.push('⭐');
                        return output.length ? output.join('') : 'N/A';
                    };

                    let text = `_Title_: *${title.trim()}*\n\n\n`;
                    text += `_Description_: ${description.trim()}\n\n\n`;
                    text += `_Price_: $${price}\n`;
                    text += `_Category_: ${category}\n`;
                    text += `${
                        rating?.count || 0
                    } shoppers liked this product.\n`;
                    text += `_Rated_: ${emojiRating(rating?.rate)}\n`;

                    await Whatsapp.sendImage({
                        recipientPhone,
                        url: imageUrl,
                        caption: text,
                    });

                    await Whatsapp.sendSimpleButtons({
                        message: `Here is the product, what do you want to do next?`,
                        recipientPhone: recipientPhone,
                        message_id,
                        listOfButtons: [
                            {
                                title: 'Add to cart🛒',
                                id: `add_to_cart_${product_id}`,
                            },
                            {
                                title: 'Speak to a human',
                                id: 'speak_to_human',
                            },
                            {
                                title: 'See more products',
                                id: 'see_stores',
                            },
                        ],
                    });
                }
            }

            if (typeOfMsg === 'simple_button_message') {
                let button_id = incomingMessage.button_reply.id;

                if (button_id === 'speak_to_human') {
                    // respond with a list of human resources
                    await Whatsapp.sendText({
                        recipientPhone: recipientPhone,
                        message: `Not to brag, but unlike humans, chatbots are super fast⚡, we never sleep, never rest, never take lunch🍽 and can multitask.\n\nAnway don't fret, a hoooooman will 📞contact you soon.\n\nWanna blast☎ his/her phone😈?\nHere are the contact details:`,
                    });

                    await Whatsapp.sendContact({
                        recipientPhone: recipientPhone,
                        contact_profile: {
                            addresses: [
                                {
                                    city: 'Nairobi',
                                    country: 'Kenya',
                                },
                            ],
                            name: {
                                first_name: 'Daggie',
                                last_name: 'Blanqx',
                            },
                            org: {
                                company: 'Mom-N-Pop Shop',
                            },
                            phones: [
                                {
                                    phone: '+1 (555) 025-3483',
                                },
                                {
                                    phone: '+254 712345678',
                                },
                            ],
                        },
                    });
                }
                if (button_id === 'see_stores') {
                    let categories = await Store.getAllCategories();

                    await Whatsapp.sendText({
                        recipientPhone: recipientPhone,
                        message: `_Here are the stores at Mosioatunya mall._\n\n🏬 `,
                    });
                }

                if (button_id.startsWith('category_')) {
                    let selectedCategory = button_id.split('category_')[1];
                    let listOfProducts = await Store.getProductsInCategory(
                        selectedCategory
                    );

                    let listOfSections = [
                        {
                            title: `🏆 Top 3: ${selectedCategory}`.substring(
                                0,
                                24
                            ),
                            rows: listOfProducts.data
                                .map((product) => {
                                    let id = `product_${product.id}`.substring(
                                        0,
                                        256
                                    );
                                    let title = product.title.substring(0, 21);
                                    let description =
                                        `${product.price}\n${product.description}`.substring(
                                            0,
                                            68
                                        );

                                    return {
                                        id,
                                        title: `${title}...`,
                                        description: `$${description}...`,
                                    };
                                })
                                .slice(0, 10),
                        },
                    ];

                    await Whatsapp.sendRadioButtons({
                        recipientPhone: recipientPhone,
                        headerText: `#BlackFriday Offers: ${selectedCategory}`,
                        bodyText: `Our Santa 🎅🏿 has lined up some great products for you based on your previous shopping history.\n\nPlease select one of the products below:`,
                        footerText: 'Powered by: BMI LLC',
                        listOfSections,
                    });
                }

                if (button_id.startsWith('add_to_cart_')) {
                    let product_id = button_id.split('add_to_cart_')[1];
                    await addToCart({ recipientPhone, product_id });
                    let numberOfItemsInCart = listOfItemsInCart({
                        recipientPhone,
                    }).count;

                    await Whatsapp.sendSimpleButtons({
                        message: `Your cart has been updated.\nNumber of items in cart: ${numberOfItemsInCart}.\n\nWhat do you want to do next?`,
                        recipientPhone: recipientPhone,
                        message_id,
                        listOfButtons: [
                            {
                                title: 'Checkout 🛍️',
                                id: `checkout`,
                            },
                            {
                                title: 'See more products',
                                id: 'see_stores',
                            },
                        ],
                    });
                }

                if (button_id === 'checkout') {
                    let finalBill = listOfItemsInCart({ recipientPhone });
                    let invoiceText = `List of items in your cart:\n`;

                    finalBill.products.forEach((item, index) => {
                        let serial = index + 1;
                        invoiceText += `\n#${serial}: ${item.title} @ $${item.price}`;
                    });

                    invoiceText += `\n\nTotal: $${finalBill.total}`;

                    Store.generatePDFInvoice({
                        order_details: invoiceText,
                        file_path: `./invoice_${recipientName}.pdf`,
                    });

                    await Whatsapp.sendText({
                        message: invoiceText,
                        recipientPhone: recipientPhone,
                    });

                    await Whatsapp.sendSimpleButtons({
                        recipientPhone: recipientPhone,
                        message: `Thank you for shopping with us, ${recipientName}.\n\nYour order has been received & will be processed shortly.`,
                        message_id,
                        listOfButtons: [
                            {
                                title: 'See more products',
                                id: 'see_stores',
                            },
                            {
                                title: 'Print my invoice',
                                id: 'print_invoice',
                            },
                        ],
                    });

                    clearCart({ recipientPhone });
                }

                if (button_id === 'print_invoice') {
                    // Send the PDF invoice
                    await Whatsapp.sendDocument({
                        recipientPhone,
                        caption: `Mom-N-Pop Shop invoice #${recipientName}`,
                        file_path: `./invoice_${recipientName}.pdf`,
                    });

                    // Send the location of our pickup station to the customer, so they can come and pick their order
                    let warehouse = Store.generateRandomGeoLocation();

                    await Whatsapp.sendText({
                        recipientPhone: recipientPhone,
                        message: `Your order has been fulfilled. Come and pick it up, as you pay, here:`,
                    });

                    await Whatsapp.sendLocation({
                        recipientPhone,
                        latitude: warehouse.latitude,
                        longitude: warehouse.longitude,
                        address: warehouse.address,
                        name: 'Mom-N-Pop Shop',
                    });
                }
            }

            await Whatsapp.markMessageAsRead({
                message_id,
            });
        }

        return res.sendStatus(200);
    } catch (error) {
        console.error({ error });
        return res.sendStatus(500);
    }
});

module.exports = router;
