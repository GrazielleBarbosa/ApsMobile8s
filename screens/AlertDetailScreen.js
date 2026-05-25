/**
 * AlertDetailScreen.js — Tela de detalhe de um alerta ambiental.
 *
 * Esta tela implementa o requisito da documentação:
 *   "Apresentação do programa em funcionamento, demonstrando a implementação
 *    dos requisitos" — especificamente os 5 tipos de alerta ambiental.
 *
 * Recebe via navigation.params:
 *   - alert:    { type, level, message }
 *   - cityName: string — nome da cidade consultada
 *
 * Exibe:
 *   - Ícone e título do tipo de alerta
 *   - Nível de severidade com cor dinâmica
 *   - Mensagem gerada pela API intermediária
 *   - Explicação detalhada sobre o fenômeno ambiental
 *   - Lista de recomendações práticas ao usuário
 */

import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import styles from '../styles';

// ── Dados estáticos de contexto por tipo de alerta ──────────────────────────

const ALERT_TITLES = {
  poluicao_ar:      'Poluição do Ar',
  alagamento:       'Risco de Alagamento',
  inversao_termica: 'Inversão Térmica',
  mananciais:       'Alerta de Mananciais',
  desmatamento:     'Risco de Incêndio / Desmatamento',
  geral:            'Condições Normais',
};

const ALERT_ICONS = {
  poluicao_ar:      'cloud-outline',
  alagamento:       'water-outline',
  inversao_termica: 'thermometer-outline',
  mananciais:       'beaker-outline',
  desmatamento:     'leaf-outline',
  geral:            'checkmark-circle-outline',
};

const ALERT_EXPLANATIONS = {
  poluicao_ar:
    'A qualidade do ar é medida pelo Índice de Qualidade do Ar (AQI), baseado na ' +
    'concentração de partículas PM2.5, PM10, CO₂, NO₂ e O₃. Altos índices ' +
    'causam irritação respiratória, agravamento de asma e bronquite. Crianças, ' +
    'idosos e pessoas com doenças pulmonares compõem os grupos de maior risco.',

  alagamento:
    'Alagamentos urbanos ocorrem quando a precipitação supera a capacidade de ' +
    'escoamento das galerias pluviais. Áreas com baixo relevo, próximas a rios ou ' +
    'com alta impermeabilização do solo são mais vulneráveis. Em períodos de chuva ' +
    'intensa, o risco de inundação pode se agravar em minutos.',

  inversao_termica:
    'A inversão térmica acontece quando uma camada de ar quente forma uma "tampa" ' +
    'sobre a camada de ar frio junto ao solo. Isso impede a dispersão de poluentes, ' +
    'que ficam concentrados próximo ao nível do chão. O fenômeno é mais comum em ' +
    'invernos secos, madrugadas frias seguidas de dias quentes e períodos de calmaria.',

  mananciais:
    'Mananciais são fontes naturais de água utilizadas para abastecimento urbano. ' +
    'Períodos de seca severa e ventos fortes aumentam a evaporação e reduzem o ' +
    'volume hídrico, tornando as áreas mais vulneráveis à degradação. A preservação ' +
    'da mata ciliar e o uso consciente da água são essenciais para sua proteção.',

  desmatamento:
    'O clima quente e seco favorece a propagação de incêndios em vegetação. O ' +
    'desmatamento reduz a umidade do solo e compromete o microclima local. Focos de ' +
    'calor podem ser monitorados pelo INPE. Em dias críticos, qualquer centelha pode ' +
    'iniciar um incêndio de grandes proporções em áreas de vegetação nativa.',

  geral:
    'As condições ambientais monitoradas estão dentro dos parâmetros normais. ' +
    'Continue acompanhando as atualizações para se manter informado sobre eventuais ' +
    'mudanças nas condições climáticas e ambientais da sua região.',
};

const ALERT_RECOMMENDATIONS = {
  poluicao_ar: [
    'Evite atividades físicas intensas ao ar livre',
    'Use máscara N95 ou PFF2 se precisar sair em dias críticos',
    'Mantenha janelas fechadas em horários de pico de tráfego',
    'Hidrate-se com frequência',
    'Grupos sensíveis devem consultar um médico',
  ],
  alagamento: [
    'Evite transitar em áreas baixas e próximas a rios',
    'Nunca dirija por ruas alagadas — 30 cm de água podem arrastar um carro',
    'Fique longe de bueiros e bocas de lobo abertas',
    'Acompanhe os alertas da Defesa Civil (SMS 40199)',
    'Mantenha um kit de emergência acessível',
  ],
  inversao_termica: [
    'Evite exercícios ao ar livre nas primeiras horas da manhã',
    'Pessoas com asma ou bronquite devem redobrar atenção',
    'Ventile ambientes fechados quando a qualidade do ar melhorar',
    'Evite queimadas e uso de lareira',
    'Prefira transporte público a veículos individuais',
  ],
  mananciais: [
    'Economize água: feche torneiras durante o banho e escovação',
    'Não descarte resíduos em córregos, rios ou margens de mananciais',
    'Denuncie desmatamento e ocupações irregulares em áreas de manancial',
    'Reporte vazamentos à concessionária de água local',
    'Plante árvores nativas próximas a cursos d\'água',
  ],
  desmatamento: [
    'Não realize queimadas em nenhuma circunstância',
    'Não jogue bitucas de cigarro em áreas com vegetação',
    'Reporte focos de incêndio ao Corpo de Bombeiros: 193',
    'Monitore o mapa de focos do INPE: queimadas.dgi.inpe.br',
    'Hidrate-se bastante em dias de baixa umidade',
  ],
  geral: [
    'Continue monitorando as condições climáticas da sua região',
    'Mantenha-se informado por fontes oficiais: INMET, INPE e Defesa Civil',
    'Pratique atividades ao ar livre com protetor solar e hidratação',
    'Lembre-se: condições podem mudar rapidamente',
  ],
};

// Cores de fundo e texto do cabeçalho por nível
const LEVEL_COLORS = {
  alto:       { bg: 'rgba(220,53,69,0.4)',  text: '#ff6b6b' },
  moderado:   { bg: 'rgba(255,193,7,0.3)',  text: '#ffd93d' },
  informativo:{ bg: 'rgba(13,202,240,0.25)',text: '#74c0fc' },
  baixo:      { bg: 'rgba(25,135,84,0.3)',  text: '#69db7c' },
};

// ── Componente ──────────────────────────────────────────────────────────────

export default function AlertDetailScreen() {
  const navigation = useNavigation();
  const { params }  = useRoute();

  // Parâmetros recebidos via navigate('AlertDetail', { alert, cityName })
  const { alert, cityName } = params ?? {};

  if (!alert) {
    return (
      <LinearGradient colors={['#6a11cb', '#2575fc']} style={styles.container}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
          <Text style={styles.backButtonText}>Voltar</Text>
        </TouchableOpacity>
        <Text style={[styles.detailCardText, { marginTop: 40, textAlign: 'center' }]}>
          Dados do alerta não encontrados.
        </Text>
      </LinearGradient>
    );
  }

  const colors          = LEVEL_COLORS[alert.level] ?? LEVEL_COLORS.informativo;
  const title           = ALERT_TITLES[alert.type]  ?? 'Alerta Ambiental';
  const iconName        = ALERT_ICONS[alert.type]   ?? 'alert-circle-outline';
  const explanation     = ALERT_EXPLANATIONS[alert.type] ?? ALERT_EXPLANATIONS.geral;
  const recommendations = ALERT_RECOMMENDATIONS[alert.type] ?? ALERT_RECOMMENDATIONS.geral;

  return (
    <LinearGradient colors={['#6a11cb', '#2575fc']} style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Botão Voltar */}
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          accessibilityLabel="Voltar para o painel principal"
          accessibilityRole="button"
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
          <Text style={styles.backButtonText}>Voltar</Text>
        </TouchableOpacity>

        {/* Cabeçalho do alerta */}
        <View style={[styles.detailHeader, { backgroundColor: colors.bg }]}>
          <Ionicons name={iconName} size={52} color="#fff" />
          <Text style={styles.detailTitle}>{title}</Text>
          <Text style={[styles.detailLevel, { color: colors.text }]}>
            Nível: {alert.level.toUpperCase()}
          </Text>
          {cityName ? (
            <Text style={styles.detailCity}>📍 {cityName}</Text>
          ) : null}
        </View>

        {/* Condição identificada (mensagem da API) */}
        <View style={styles.detailCard}>
          <Text style={styles.detailCardTitle}>⚠️ Condição identificada</Text>
          <Text style={styles.detailCardText}>{alert.message}</Text>
        </View>

        {/* Explicação do fenômeno */}
        <View style={styles.detailCard}>
          <Text style={styles.detailCardTitle}>ℹ️ Sobre este fenômeno</Text>
          <Text style={styles.detailCardText}>{explanation}</Text>
        </View>

        {/* Recomendações práticas */}
        <View style={styles.detailCard}>
          <Text style={styles.detailCardTitle}>✅ O que fazer</Text>
          {recommendations.map((rec, i) => (
            <Text key={i} style={styles.detailRecommendation}>
              • {rec}
            </Text>
          ))}
        </View>

        <Text style={styles.footerNote}>
          Informações baseadas em dados meteorológicos em tempo real.{'\n'}
          Fonte: OpenWeatherMap via API intermediária APS Mobile.
        </Text>
      </ScrollView>
    </LinearGradient>
  );
}
