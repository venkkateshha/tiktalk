import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme';
import { BrandColors } from '../../theme/colors';
import { useCreateWorkflow } from './hooks/useCreateWorkflow';
import {
  CreateHubView,
  CameraCaptureView,
  VideoPreviewPlayer,
  VideoEditToolbar,
  CaptionEditorModal,
  AudioPickerModal,
  CoverPickerModal,
  PublishDetailsView,
  DraftsListView,
  UploadProgressModal,
} from './components';
import { A11yStandards } from '../../core/a11y/a11yStandards';

export const CreateScreen: React.FC = () => {
  const { theme, typography } = useTheme();
  const workflow = useCreateWorkflow();

  const [showCaptionsModal, setShowCaptionsModal] = useState<boolean>(false);
  const [showAudioModal, setShowAudioModal] = useState<boolean>(false);
  const [showCoverModal, setShowCoverModal] = useState<boolean>(false);
  const [draftSavedMessage, setDraftSavedMessage] = useState<string | null>(null);

  const handleSaveDraft = async () => {
    const d = await workflow.saveCurrentDraft();
    if (d) {
      setDraftSavedMessage('Draft saved!');
      setTimeout(() => setDraftSavedMessage(null), 2000);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* 1. CREATE HUB VIEW */}
      {workflow.mode === 'hub' && (
        <CreateHubView
          onRecordVideo={workflow.startCamera}
          onUploadVideo={workflow.pickFromGallery}
          onOpenDrafts={workflow.showDrafts}
          draftsCount={workflow.drafts.length}
        />
      )}

      {/* 2. CAMERA CAPTURE VIEW */}
      {workflow.mode === 'camera' && (
        <CameraCaptureView
          onCancel={workflow.goToHub}
          onCompleteCapture={workflow.proceedToEdit}
          onOpenGallery={workflow.pickFromGallery}
        />
      )}

      {/* 3. VIDEO EDIT VIEW */}
      {workflow.mode === 'edit' && workflow.selectedAsset && (
        <View style={styles.editLayout}>
          {/* Top Header */}
          <View style={[styles.editHeader, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <TouchableOpacity
              onPress={workflow.goToHub}
              style={[styles.headerBtn, A11yStandards.minTouchTarget]}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Discard video and return to create hub"
            >
              <Ionicons name="close" size={24} color={theme.text} />
            </TouchableOpacity>

            {/* Save draft button in middle */}
            <TouchableOpacity
              onPress={handleSaveDraft}
              style={[styles.draftHeaderBtn, A11yStandards.minTouchTarget]}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Save video draft"
            >
              <Ionicons name="save-outline" size={18} color={BrandColors.cyan} />
              <Text style={[styles.draftHeaderText, { color: BrandColors.cyan, fontSize: typography.fontSize.xs }]}>
                {draftSavedMessage || 'Save Draft'}
              </Text>
            </TouchableOpacity>

            {/* Next Button to proceed to details */}
            <TouchableOpacity
              onPress={workflow.proceedToDetails}
              style={[styles.nextBtn, A11yStandards.minTouchTarget, { backgroundColor: BrandColors.pink }]}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Proceed to post details"
            >
              <Text style={[styles.nextBtnText, { fontSize: typography.fontSize.sm }]}>Next</Text>
              <Ionicons name="chevron-forward" size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* Center Video Player Preview */}
          <View style={styles.previewContainer}>
            <VideoPreviewPlayer
              asset={workflow.selectedAsset}
              playbackSpeed={workflow.editState.playbackSpeed}
              isMuted={workflow.editState.isMuted}
              trimStartSeconds={workflow.editState.trimStartSeconds}
              trimEndSeconds={workflow.editState.trimEndSeconds}
              onToggleMute={() =>
                workflow.updateEditState({ isMuted: !workflow.editState.isMuted })
              }
            />

            {/* Optional Floating Caption Overlay */}
            {workflow.editState.captionConfig.enabled && workflow.editState.captionConfig.text ? (
              <View
                style={[
                  styles.captionOverlay,
                  workflow.editState.captionConfig.position === 'top' && styles.captionTop,
                  workflow.editState.captionConfig.position === 'center' && styles.captionCenter,
                  workflow.editState.captionConfig.position === 'bottom' && styles.captionBottom,
                ]}
                pointerEvents="none"
              >
                <Text
                  style={[
                    styles.captionText,
                    workflow.editState.captionConfig.style === 'neon' && styles.captionNeon,
                    workflow.editState.captionConfig.style === 'bold' && styles.captionBold,
                    workflow.editState.captionConfig.style === 'minimal' && styles.captionMinimal,
                  ]}
                >
                  {workflow.editState.captionConfig.text}
                </Text>
              </View>
            ) : null}
          </View>

          {/* Bottom Editing HUD */}
          <VideoEditToolbar
            editState={workflow.editState}
            maxDuration={workflow.selectedAsset.durationSeconds || 15}
            onUpdateEditState={workflow.updateEditState}
            onOpenCaptions={() => setShowCaptionsModal(true)}
            onOpenAudio={() => setShowAudioModal(true)}
            onOpenCover={() => setShowCoverModal(true)}
          />

          {/* Modals */}
          <CaptionEditorModal
            visible={showCaptionsModal}
            initialConfig={workflow.editState.captionConfig}
            onSave={(cfg) => workflow.updateEditState({ captionConfig: cfg })}
            onClose={() => setShowCaptionsModal(false)}
          />

          <AudioPickerModal
            visible={showAudioModal}
            currentAudio={workflow.editState.audioSelection}
            isMuted={workflow.editState.isMuted}
            volume={workflow.editState.volume}
            onSelectAudio={(audio) => workflow.updateEditState({ audioSelection: audio })}
            onUpdateVolume={(vol) => workflow.updateEditState({ volume: vol })}
            onToggleMute={() => workflow.updateEditState({ isMuted: !workflow.editState.isMuted })}
            onClose={() => setShowAudioModal(false)}
          />

          <CoverPickerModal
            visible={showCoverModal}
            coverConfig={workflow.editState.coverConfig}
            durationSeconds={workflow.selectedAsset.durationSeconds || 15}
            onSave={(cover) => workflow.updateEditState({ coverConfig: cover })}
            onClose={() => setShowCoverModal(false)}
          />
        </View>
      )}

      {/* 4. PUBLISH DETAILS VIEW */}
      {workflow.mode === 'details' && (
        <PublishDetailsView
          publishConfig={workflow.publishConfig}
          onUpdatePublishConfig={workflow.updatePublishConfig}
          onBackToEdit={workflow.backToEdit}
          onSaveDraft={async () => {
            await workflow.saveCurrentDraft();
          }}
          onPublish={workflow.publishCurrent}
          isPublishing={workflow.uploadState === 'publishing' || workflow.uploadState === 'uploading'}
        />
      )}

      {/* 5. DRAFTS LIST VIEW */}
      {workflow.mode === 'drafts' && (
        <DraftsListView
          drafts={workflow.drafts}
          onSelectDraft={workflow.resumeDraft}
          onDeleteDraft={workflow.deleteDraft}
          onBack={workflow.goToHub}
          onCreateNew={workflow.startCamera}
        />
      )}

      {/* 6. UPLOAD PROGRESS & ERROR MODAL */}
      <UploadProgressModal
        uploadState={workflow.uploadState}
        uploadProgress={workflow.uploadProgress}
        errorMessage={workflow.errorMessage}
        onCancel={workflow.cancelUpload}
        onDismiss={workflow.resetWorkflow}
        onRetry={workflow.publishCurrent}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  editLayout: {
    flex: 1,
    position: 'relative',
    backgroundColor: '#000000',
  },
  editHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    zIndex: 10,
  },
  headerBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 44,
    minHeight: 44,
  },
  draftHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(37, 244, 238, 0.1)',
    minHeight: 44,
  },
  draftHeaderText: {
    fontWeight: '700',
  },
  nextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    minHeight: 44,
  },
  nextBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  previewContainer: {
    flex: 1,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000000',
  },
  captionOverlay: {
    position: 'absolute',
    left: 20,
    right: 20,
    alignItems: 'center',
    zIndex: 5,
  },
  captionTop: {
    top: 24,
  },
  captionCenter: {
    top: '45%',
  },
  captionBottom: {
    bottom: 40,
  },
  captionText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  captionNeon: {
    color: BrandColors.cyan,
    textShadowColor: BrandColors.cyan,
    textShadowRadius: 8,
  },
  captionBold: {
    fontWeight: '900',
    fontSize: 18,
  },
  captionMinimal: {
    backgroundColor: 'transparent',
    opacity: 0.9,
    fontSize: 14,
  },
});
