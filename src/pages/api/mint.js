const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));


export default async function handler(req, res) {
  try {
    const data = JSON.stringify({
      recipient: `polygon:${req.body.address}`,
      metadata: req.body.uri,
    })

    const mintRes = await fetch(`https://www.crossmint.com/api/2022-06-09/collections/${process.env.CROSSMINT_COLLECTION_ID}/nfts`, {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        'x-client-secret': `${process.env.CROSSMINT_CLIENT_SECRET}`,
        'x-project-id': `${process.env.CROSSMINT_PROJECT_ID}`
      },
      body: data
    })

    const mintResJson = await mintRes.json()

    if (mintResJson.onChain.status === "pending") {
      while (true) {
        delay(8000)

        const mintStatus = await fetch(`https://www.crossmint.com/api/2022-06-09/collections/${process.env.CROSSMINT_COLLECTION_ID}/nfts/${mintResJson.id}`, {
          method: 'GET',
          headers: {
            accept: 'application/json',
            'x-client-secret': `${process.env.CROSSMINT_CLIENT_SECRET}`,
            'x-project-id': `${process.env.CROSSMINT_PROJECT_ID}`
          }
        })

        const mintStatusJson = await mintStatus.json()

        if (mintStatusJson.onChain.status === "success") {
          console.log(mintStatusJson)
          res.status(200).json(mintStatusJson)
          return
        }
      }
    }
  } catch (error) {
    console.log(error)
    res.status(500).json({ text: "Error minting NFT", error: error })
  }
}

