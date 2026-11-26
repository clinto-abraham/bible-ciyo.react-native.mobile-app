import { useMemo, useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getLanguages } from '@/lib/bible';
import { setPreferredLanguage } from '@/lib/preferences';
import { Palette } from '@/constants/palette';
import AppHeader from '@/components/AppHeader';

const CODICES = [
  { title: 'Biblical Hebrew Tanakh', subtitle: 'Westminster Leningrad Codex (WLC)', scope: '39 OT Books', badge: 'Ancient Hebrew' },
  { title: 'Koine Greek New Testament', subtitle: 'Textus Receptus (1550 / 1894)', scope: '27 NT Books', badge: 'Historic Greek' },
  { title: 'Syriac Aramaic New Testament', subtitle: 'Syriac Peshitta (ܦܫܝܛܬܐ)', scope: '27 NT + Gen 1', badge: 'Semitic Aramaic' },
  { title: 'English Authorized Version', subtitle: 'King James Version (KJV 1769)', scope: '66 Books', badge: 'Historic English' },
  { title: 'Berean Standard Bible', subtitle: 'Berean Standard Bible (BSB)', scope: '66 Books', badge: 'Modern English' },
  { title: "Young's Literal Translation", subtitle: 'Robert Young (YLT 1898)', scope: '66 Books', badge: 'Literal' },
  { title: 'Malayalam Holy Bible', subtitle: 'സത്യവേദപുസ്തകം (1910)', scope: '66 Books', badge: 'Indian Classical' },
  { title: 'Latin Sacred Vulgate', subtitle: 'Biblia Sacra Vulgata (1592)', scope: '78 Books', badge: 'Western Liturgical' },
  { title: 'German Elberfelder Bibel', subtitle: 'Unrevidierte Elberfelder (1905)', scope: '66 Books', badge: 'Germanic' },
  { title: 'French Augustin Crampon', subtitle: 'Bible Augustin Crampon (1923)', scope: '73 Books', badge: 'Romance' },
  { title: 'Spanish Reina-Valera', subtitle: 'Reina-Valera Antigua (1909)', scope: '66 Books', badge: 'Hispanic' },
  { title: 'Russian Synodal Bible', subtitle: 'Синодальный перевод (1876)', scope: '78 Books', badge: 'Slavic Cyrillic' },
  { title: 'Chinese Union Version', subtitle: '和合本 (CUV 1919)', scope: '66 Books', badge: 'East Asian' },
  { title: 'Burmese Judson Translation', subtitle: 'Adoniram Judson (1835)', scope: '66 Books', badge: 'Southeast Asian' },
  { title: 'Church Slavonic Elizabeth Bible', subtitle: 'Елизаветинская Библия (1751)', scope: '76 Books', badge: 'Liturgical Slavonic' },
];

export default function AboutScreen() {
  const [lang, setLang] = useState('english');
  const languages = useMemo(() => getLanguages(), []);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <AppHeader
        currentLang={lang}
        languages={languages}
        showBackToReader
        onSelectLang={async (id) => {
          setLang(id);
          await setPreferredLanguage(id);
        }}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <View style={styles.pill}>
            <View style={styles.dot} />
            <Text style={styles.pillText}>OPEN-ACCESS THEOLOGICAL PLATFORM</Text>
          </View>
          <Text style={styles.title}>
            About <Text style={{ color: Palette.sky }}>Sacred Scriptures</Text>
          </Text>
          <Text style={styles.subtitle}>
            A 100% non-commercial platform built to preserve, cross-reference, and illuminate the
            Divine Scriptures across 15 ancient manuscripts and world translations.
          </Text>
        </View>

        {/* Non-Commercial Card */}
        <View style={styles.noticeCard}>
          <Text style={styles.noticeBadge}>NON-COMMERCIAL DECLARATION</Text>
          <Text style={styles.noticeTitle}>Freely Given, Freely Received</Text>
          <Text style={styles.noticeText}>
            100% non-commercial and free for everyone without paywalls, ads, or monetization.
          </Text>

          <View style={styles.btnRow}>
            <Pressable
              onPress={() => Linking.openURL('https://github.com/clinto-abraham/bible.ciyo.in')}
              style={styles.githubBtn}
            >
              <Ionicons name="logo-github" size={16} color={Palette.textWhite} />
              <Text style={styles.btnText}>GitHub</Text>
            </Pressable>

            <Pressable
              onPress={() =>
                Linking.openURL('mailto:care@ciyo.in?subject=Sacred%20Scriptures%20Inquiry')
              }
              style={styles.emailBtn}
            >
              <Ionicons name="mail-outline" size={16} color={Palette.textSlate200} />
              <Text style={styles.btnText}>care@ciyo.in</Text>
            </Pressable>
          </View>
        </View>

        {/* 15 Codices */}
        <View style={{ gap: 10 }}>
          <Text style={styles.sectionTitle}>THE 15 HISTORICAL CODICES</Text>
          {CODICES.map((c, i) => (
            <View key={c.title} style={styles.codexCard}>
              <View style={styles.codexTop}>
                <Text style={styles.codexNum}>#{i + 1}</Text>
                <View style={styles.codexBadge}>
                  <Text style={styles.codexBadgeText}>{c.badge}</Text>
                </View>
              </View>
              <Text style={styles.codexTitle}>{c.title}</Text>
              <Text style={styles.codexSub}>{c.subtitle}</Text>
              <Text style={styles.codexScope}>{c.scope}</Text>
            </View>
          ))}
        </View>

        {/* Contact */}
        <View style={styles.contactCard}>
          <Text style={styles.sectionTitle}>PUBLISHER & CONTACT</Text>
          <Pressable
            onPress={() => Linking.openURL('mailto:care@ciyo.in')}
            style={styles.contactRow}
          >
            <Ionicons name="mail-outline" size={16} color={Palette.sky} />
            <Text style={styles.contactLink}>care@ciyo.in</Text>
          </Pressable>
          <Pressable
            onPress={() => Linking.openURL('tel:+918590770477')}
            style={styles.contactRow}
          >
            <Ionicons name="call-outline" size={16} color={Palette.amber} />
            <Text style={[styles.contactLink, { color: Palette.amber }]}>+91-8590770477</Text>
          </Pressable>
          <View style={styles.contactRow}>
            <Ionicons name="location-outline" size={16} color={Palette.emeraldLight} />
            <Text style={styles.contactAddr}>Iritty, Kannur, Kerala 670703, India</Text>
          </View>
        </View>

        <Pressable onPress={() => router.push('/')} style={styles.ctaBtn}>
          <Text style={styles.ctaText}>Start Reading the Scriptures →</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Palette.bgBase,
  },
  scrollContent: {
    paddingHorizontal: 14,
    paddingTop: 18,
    paddingBottom: 42,
    gap: 20,
  },
  hero: {
    alignItems: 'center',
    gap: 10,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: Palette.bgCard,
    borderWidth: 1,
    borderColor: Palette.borderSubtle,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: Palette.emeraldLight,
  },
  pillText: {
    color: Palette.emeraldLight,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  title: {
    color: Palette.textWhite,
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
  },
  subtitle: {
    color: Palette.textSlate300,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
  },
  noticeCard: {
    padding: 18,
    borderRadius: 22,
    backgroundColor: 'rgba(6, 78, 59, 0.25)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.45)',
    gap: 8,
  },
  noticeBadge: {
    color: Palette.emeraldLight,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  noticeTitle: {
    color: Palette.textWhite,
    fontSize: 19,
    fontWeight: '700',
  },
  noticeText: {
    color: Palette.textSlate300,
    fontSize: 13,
    lineHeight: 19,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  githubBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 11,
    borderRadius: 14,
    backgroundColor: Palette.emerald,
  },
  emailBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 11,
    borderRadius: 14,
    backgroundColor: Palette.bgCard,
    borderWidth: 1,
    borderColor: Palette.borderHover,
  },
  btnText: {
    color: Palette.textWhite,
    fontSize: 12,
    fontWeight: '700',
  },
  sectionTitle: {
    color: Palette.amber,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
  codexCard: {
    padding: 14,
    borderRadius: 16,
    backgroundColor: 'rgba(15, 23, 42, 0.58)',
    borderWidth: 1,
    borderColor: Palette.borderSubtle,
    gap: 4,
  },
  codexTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  codexNum: {
    color: Palette.textDim,
    fontSize: 11,
    fontWeight: '700',
  },
  codexBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: Palette.bgSurface,
    borderWidth: 1,
    borderColor: Palette.borderHover,
  },
  codexBadgeText: {
    color: Palette.sky,
    fontSize: 10,
    fontWeight: '600',
  },
  codexTitle: {
    color: Palette.textWhite,
    fontSize: 15,
    fontWeight: '700',
  },
  codexSub: {
    color: Palette.amberLight,
    fontSize: 12,
  },
  codexScope: {
    color: Palette.textDim,
    fontSize: 11,
    marginTop: 2,
  },
  contactCard: {
    padding: 16,
    borderRadius: 20,
    backgroundColor: Palette.bgCard,
    borderWidth: 1,
    borderColor: Palette.borderSubtle,
    gap: 10,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  contactLink: {
    color: Palette.sky,
    fontSize: 14,
    fontWeight: '600',
  },
  contactAddr: {
    color: Palette.textSlate300,
    fontSize: 13,
  },
  ctaBtn: {
    alignItems: 'center',
    paddingVertical: 15,
    borderRadius: 999,
    backgroundColor: Palette.blue600,
  },
  ctaText: {
    color: Palette.textWhite,
    fontSize: 14,
    fontWeight: '700',
  },
});
