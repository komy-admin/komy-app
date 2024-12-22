import React, { useEffect, useState }  from 'react'
import { View, Image, Text} from 'react-native'
import { FileText, Calendar } from 'lucide-react-native'

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
    updateDate() // Initialise la date immédiatement
    // Calcul du temps restant jusqu'à minuit
    const now = new Date()
    const timeUntilMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0).getTime() - now.getTime()

    // Premier timeout pour arriver à minuit
    const timeout = setTimeout(() => {
      updateDate() // Met à jour la date à minuit

      // Ensuite, démarre un intervalle quotidien
      const interval = setInterval(updateDate, 24 * 60 * 60 * 1000) // 24h
      return () => clearInterval(interval) // Nettoyage de l'intervalle
    }, timeUntilMidnight)

    return () => clearTimeout(timeout) // Nettoie le timeout si le composant est démonté
  }, [])

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
        {/* Logo */}
        <Image
        source={require('~/assets/images/icone_fork_it.png')}
        style={{ width: 80, height: 80, resizeMode: 'contain' }}
        />
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center',  gap: 20 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          {/* Additions */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 20, paddingVertical: 8, paddingHorizontal: 12, borderColor:"#F3F3F3", borderWidth: 1}}>
            <FileText size={24} color="#2A2E33" strokeWidth={1}/>
            <Text style={{color: '#2A2E33', fontSize: 14, fontWeight: '300'}}>Additions</Text>
          </View>
          {/* Date */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 20, paddingVertical: 8, paddingHorizontal: 12, borderColor:"#F3F3F3", borderWidth: 1}}>
            <Calendar size={24} color="#2A2E33" strokeWidth={1}/>
            <Text style={{color: '#2A2E33', fontSize: 14, fontWeight: '300'}}>{currentDate}</Text>
          </View>
        </View>
         {/* Profil utilisateur */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Image
            source={require('~/assets/images/icone_user_test.webp')}
            style={{
              width: 45,
              height: 45,
              borderRadius: 30,
            }}
          />
          <View>
            <Text style={{ color: '#2A2E33', fontSize: 15, fontWeight: '300' }}>
              François Bravo
            </Text>
            <Text style={{ color: '#64666A', fontSize: 14, fontWeight: '200' }}>Admin</Text>
          </View>
        </View>
      </View>
    </View>
  )
}