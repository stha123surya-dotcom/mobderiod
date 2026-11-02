FROM ubuntu:22.04

ENV DEBIAN_FRONTEND=noninteractive
ENV ANDROID_HOME=/opt/android-sdk
ENV PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools:$ANDROID_HOME/emulator

# Install essential dependencies, OpenJDK 17, QEMU KVM, and video tools
RUN apt-get update && apt-get install -y --no-install-recommends \
    openjdk-17-jdk \
    wget \
    unzip \
    curl \
    git \
    qemu-kvm \
    libvirt-daemon-system \
    libvirt-clients \
    bridge-utils \
    libgl1-mesa-glx \
    pulseaudio \
    socat \
    adb \
    ffmpeg \
    nodejs \
    npm \
    && rm -rf /var/lib/apt/lists/*

# Install Android Command Line Tools
WORKDIR /tmp
RUN wget -q https://dl.google.com/android/repository/commandlinetools-linux-11076708_latest.zip -O cmdline-tools.zip \
    && mkdir -p $ANDROID_HOME/cmdline-tools \
    && unzip -q cmdline-tools.zip -d $ANDROID_HOME/cmdline-tools \
    && mv $ANDROID_HOME/cmdline-tools/cmdline-tools $ANDROID_HOME/cmdline-tools/latest \
    && rm cmdline-tools.zip

# Accept Android SDK licenses
RUN yes | sdkmanager --licenses || true

# Install platform-tools, emulator, and Android 34 system image
RUN sdkmanager "platform-tools" "emulator" "platforms;android-34" "system-images;android-34;google_apis;x86_64"

# Create AVD (Android Virtual Device)
RUN echo "no" | avdmanager create avd -n WebDroid_AVD_34 -k "system-images;android-34;google_apis;x86_64" --device "pixel_8"

WORKDIR /app
COPY package*.json ./
RUN npm install express ws @types/node @types/express @types/ws tsx typescript

COPY worker-server.ts ./

EXPOSE 5555
EXPOSE 8554

CMD ["npx", "tsx", "worker-server.ts"]
