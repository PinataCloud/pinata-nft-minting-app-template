import { useState } from 'react'
import styles from '@/styles/Form.module.css'
import ScaleLoader from "react-spinners/ScaleLoader"
import fireConfetti from "../../utils/confetti"
import { useAccount } from 'wagmi'
import { ConnectButton } from '@rainbow-me/rainbowkit';


const Form = () => {
  const [selectedFile, setSelectedFile] = useState()
  const [name, setName] = useState()
  const [description, setDescription] = useState()
  const [externalURL, setExternalURL] = useState()
  const [osLink, setOsLink] = useState("https://opensea.io")
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [isComplete, setIsComplete] = useState(false)


  const { address } = useAccount()

  const fileChangeHandler = (event) => {
    setSelectedFile(event.target.files[0])
  }
  const nameChangeHandler = (event) => {
    setName(event.target.value)
  }
  const descriptionChangeHandler = (event) => {
    setDescription(event.target.value)
  }
  const externalURLChangeHandler = (event) => {
    setExternalURL(event.target.value)
  }

  const handleSubmission = async () => {
    let key;
    let hash;
    let uri
    let keyId;

    try {
      setIsLoading(true)
      try {
        const tempKey = await fetch("/api/key", {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        })
        const tempKeyJson = await tempKey.json()
        key = tempKeyJson.JWT
        keyId = tempKeyJson.pinata_api_key
      } catch (error) {
        console.log("error making API key:", error)
      }

      try {
        const formData = new FormData()
        formData.append('file', selectedFile, { filepath: selectedFile.name })

        const metadata = JSON.stringify({
          name: `${selectedFile.name}`,
        })
        formData.append('pinataMetadata', metadata)

        const options = JSON.stringify({
          cidVersion: 0,
        })
        formData.append('pinataOptions', options)

        setMessage("Uploading File...")
        const uploadRes = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${key}`,
          },
          body: formData
        })
        const uploadResJson = await uploadRes.json()
        hash = uploadResJson.IpfsHash
      } catch (error) {
        console.log("Error uploading file:", error)
      }

      try {
        const jsonData = JSON.stringify({
          name: name,
          description: description,
          image: process.env.NEXT_PUBLIC_PINATA_DEDICATED_GATEWAY + hash,
          external_url: externalURL
        })

        setMessage("Uploading Metadata...")

        const jsonRes = await fetch("https://api.pinata.cloud/pinning/pinJSONToIPFS", {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${key}`,
          },
          body: jsonData
        })
        const jsonResData = await jsonRes.json()
        uri = jsonResData.IpfsHash
      } catch (error) {
        console.log("Error uploading metadata:", error)
      }

      try {
        const mintBody = JSON.stringify({
          address: address,
          uri: process.env.NEXT_PUBLIC_PINATA_DEDICATED_GATEWAY + uri,
        })

        setMessage("Minting NFT...")
        const mintRes = await fetch("/api/mint", {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: mintBody
        })
        const mintResData = await mintRes.json()
        setOsLink(`https://opensea.io/assets/matic/${mintResData.onChain.contractAddress}/${mintResData.onChain.tokenId}`)
      } catch (error) {
        console.log("Error minting NFT:", error)
      }

      try {
        const deleteData = JSON.stringify({
          apiKey: keyId,
        })
        const deleteKey = await fetch("/api/key", {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: deleteData
        })
      } catch (error) {
        console.log("Error deleting API key:", error)
      }
      setMessage("Minting Complete!")
      setIsLoading(false)
      setIsComplete(true)
      fireConfetti()
    } catch (error) {
      console.log(error)
      setIsLoading(false)
      setIsComplete(false)
      alert("Error Minting NFT")
    }
  }


  return (
    <div className={styles.form}>
      <div className={styles.button}>
        <ConnectButton />
      </div>
      {!isLoading && !isComplete && (
        <>
          <label className={styles.formInput} onChange={fileChangeHandler} htmlFor="file">
            <input name="" type="file" id="file" hidden />
            <p>{!selectedFile ? "Select File" : `${selectedFile.name}`}</p>
          </label>
          <label>Name</label>
          <input type='text' placeholder='Cool NFT' onChange={nameChangeHandler} />
          <label>Description</label>
          <input
            type='text'
            placeholder='This NFT is just so cool'
            onChange={descriptionChangeHandler}
          />
          <label>Your Website</label>
          <input
            type='text'
            placeholder='https://pinata.cloud'
            onChange={externalURLChangeHandler}
          />
          <button onClick={handleSubmission}>Submit</button>
        </>
      )}
      {isLoading && (
        <div className={styles.form}>
          <ScaleLoader color="#6D57FF" height="150px" width="15px" />
          <h2>{message}</h2>
        </div>
      )}
      {isComplete && (
        <div className={styles.form}>
          <h4>{message}</h4>
          <a href={osLink} target="_blank" className={styles.link} rel="noreferrer"><h3>Link to NFT</h3></a>
          <button onClick={() => setIsComplete(false)} className={styles.logout}>Mint Another NFT</button>
        </div>
      )}
    </div>
  )
}

export default Form
