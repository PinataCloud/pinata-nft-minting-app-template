import { v4 as uuidv4 } from 'uuid';
const pinataJWT = process.env.PINATA_JWT


export default async function handler(req, res) {

  if (req.method === "GET") {
    try {
      const uuid = uuidv4();
      const body = JSON.stringify({
        keyName: uuid.toString(),
        permissions: {
          admin: true
        },
        maxUses: 2
      })
      const keyRes = await fetch('https://api.pinata.cloud/users/generateApiKey', {
        method: 'POST',
        body: body,
        headers: {
          accept: 'application/json',
          'content-type': 'application/json',
          authorization: `Bearer ${pinataJWT}`
        }
      })
      const keyResJson = await keyRes.json()
      return res.send(keyResJson)

    } catch (error) {
      console.log(error.message)
      res.status(500).json({ text: "Error creating API Key", error: error })
    }
  } else if (req.method === "PUT") {
    try {
      const keyDelete = await fetch('https://api.pinata.cloud/users/revokeApiKey', {
        method: 'PUT',
        body: req.body.deleteData,
        headers: {
          accept: 'application/json',
          'content-type': 'application/json',
          authorization: `Bearer ${pinataJWT}`
        }
      })
      const keyDeleteRes = await keyDelete.json()
      return res.send(keyDeleteRes)
    } catch (error) {
      console.log(error.message)
      res.status(500).json({ text: "Error deleting API Key", error: error })
    }
  }
}
