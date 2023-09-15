import { useEffect, useState } from "react"
import '@/styles/globals.css'
import '@rainbow-me/rainbowkit/styles.css';
import {
  getDefaultWallets,
  RainbowKitProvider,
  darkTheme,
} from '@rainbow-me/rainbowkit';
import { configureChains, createConfig, WagmiConfig } from 'wagmi';
import {
  polygon
} from 'wagmi/chains';
import { alchemyProvider } from 'wagmi/providers/alchemy';
import { publicProvider } from 'wagmi/providers/public';



const { chains, publicClient } = configureChains(
  [polygon],
  [
    alchemyProvider({ apiKey: process.env.NEXT_PUBLIC_ALCHEMY_API_KEY }),
    publicProvider()
  ]
);

const { connectors } = getDefaultWallets({
  appName: 'My RainbowKit App',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_ID,
  chains
});

const wagmiConfig = createConfig({
  autoConnect: true,
  connectors,
  publicClient
})


export default function App({ Component, pageProps }) {

  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    setIsReady(true)
  }, [])
  return (
    <>
      {isReady ? (
        <WagmiConfig config={wagmiConfig}>
          <RainbowKitProvider
            chains={chains}
            initialChain={polygon}
            theme={darkTheme({
              accentColor: "#5F61EA",
              accentColorForeground: 'white',
              borderRadius: 'small'
            })}
          >
            <Component {...pageProps} />
          </RainbowKitProvider>
        </WagmiConfig>
      ) : null}
    </>
  );
}
