import React, { useEffect, useState }  from 'react'
import { View, Image, Text, Pressable} from 'react-native'
import { FileText, Calendar } from 'lucide-react-native'
import { Href, Link, router } from 'expo-router'

export function AdminTopbar() {
  const [currentDate, setCurrentDate] = useState('')

  // Fonction pour formater la date
  const updateDate = () => {
    const today = new Date()
    const day = String(today.getDate()).padStart(2, '0')
    const month = String(today.getMonth() + 1).padStart(2, '0')
    const year = today.getFullYear()
    setCurrentDate(`${day}/${month}/${year}`)
  }

  useEffect(() => {
    updateDate()
    const now = new Date()
    const timeUntilMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0).getTime() - now.getTime()

    const timeout = setTimeout(() => {
      updateDate()
      const interval = setInterval(updateDate, 24 * 60 * 60 * 1000)
      return () => clearInterval(interval)
    }, timeUntilMidnight)

    return () => clearTimeout(timeout)
  }, [])

  const configUser = '/configs'
  return (
    <View
      style={{
        width: '100%',
        height: 90,
        backgroundColor: '#EAEAEB',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingLeft: 10,
        paddingRight: 20
      }}
    >
      <View>
        <Image
          source={require('~/assets/images/icone_fork_it.png')}
          style={{ width: 80, height: 80, resizeMode: 'contain' }}
        />
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center',  gap: 20 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 20, paddingVertical: 8, paddingHorizontal: 12, borderColor:"#F3F3F3", borderWidth: 1}}>
            <FileText size={24} color="#2A2E33" strokeWidth={1}/>
            <Text style={{color: '#2A2E33', fontSize: 14, fontWeight: '300'}}>Additions</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 20, paddingVertical: 8, paddingHorizontal: 12, borderColor:"#F3F3F3", borderWidth: 1}}>
            <Calendar size={24} color="#2A2E33" strokeWidth={1}/>
            <Text style={{color: '#2A2E33', fontSize: 14, fontWeight: '300'}}>{currentDate}</Text>
          </View>
        </View>
        <Link href={`/(admin)${configUser}` as Href} key={configUser} asChild>
          <Pressable>
            <View 
              style={{ 
                flexDirection: 'row', 
                alignItems: 'center', 
                gap: 10,
              }}
            >
              <Image
                source={require('~/assets/images/icone_user_test.webp')}
                style={{
                  width: 45,
                  height: 45,
                  borderRadius: 30,
                  borderColor: '#54575B',
                }}
              />
              <View>
                <Text 
                  style={{ 
                    color: '#2A2E33',
                    fontSize: 15, 
                    fontWeight: '300'
                  }}
                >
                  Edmont Dantes
                </Text>
                <Text style={{ color: '#64666A', fontSize: 14, fontWeight: '200' }}>
                  Admin
                </Text>
              </View>
            </View>
          </Pressable>
        </Link>
      </View>
    </View>
  )
}