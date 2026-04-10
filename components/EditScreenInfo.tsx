import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Typography } from '@/constants/Typography';
import { ExternalLink } from './ExternalLink';

export default function EditScreenInfo({ path }: { path: string }) {
  return (
    <View>
      <View style={styles.getStartedContainer}>
        <Text style={[styles.getStartedText, { color: 'rgba(0,0,0,0.8)' }]}>Open up the code for this screen:</Text>

        <View style={styles.codeHighlightContainer}>
          <Text style={styles.monoText}>{path}</Text>
        </View>

        <Text style={styles.getStartedText}>Change any of the text, save the file, and your app will automatically update.</Text>
      </View>

      <View style={styles.helpContainer}>
        <ExternalLink style={styles.helpLink} href="https://docs.expo.io/get-started/create-a-new-app/#opening-the-app-on-your-phonetablet">
          <Text style={[styles.helpLinkText, { color: '#2f95dc' }]}>Tap here if your app doesn't automatically update after making changes</Text>
        </ExternalLink>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  getStartedContainer: {
    alignItems: 'center',
    marginHorizontal: 50,
  },
  homeScreenFilename: {
    marginVertical: 7,
  },
  codeHighlightContainer: {
    borderRadius: 3,
    paddingHorizontal: 4,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  getStartedText: {
    fontSize: Typography.size.body,
    lineHeight: 24,
    textAlign: 'center',
  },
  monoText: {
    fontFamily: 'SpaceMono',
  },
  helpContainer: {
    marginTop: 15,
    marginHorizontal: 20,
    alignItems: 'center',
  },
  helpLink: {
    paddingVertical: 15,
  },
  helpLinkText: {
    textAlign: 'center',
  },
});
