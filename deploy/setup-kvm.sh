#!/bin/bash
set -e

echo "=== WebDroid Linux KVM Host Setup Script ==="

# Check CPU virtualization flags
VIRT_SUPPORT=$(egrep -c '(vmx|svm)' /proc/cpuinfo || true)
if [ "$VIRT_SUPPORT" -eq 0 ]; then
    echo "WARNING: Hardware virtualization (VT-x/AMD-V) was not detected in /proc/cpuinfo."
    echo "Make sure nested virtualization is enabled in your cloud BIOS or hypervisor."
else
    echo "OK: Hardware virtualization flags detected ($VIRT_SUPPORT threads)."
fi

# Install QEMU/KVM packages on Ubuntu/Debian
echo "Installing KVM and virtualization tools..."
sudo apt-get update -y
sudo apt-get install -y qemu-kvm libvirt-daemon-system libvirt-clients bridge-utils cpu-checker

# Verify KVM status
kvm-ok || true

# Add current user to kvm group
echo "Adding user '$USER' to kvm group..."
sudo usermod -aG kvm $USER
sudo usermod -aG libvirt $USER

# Set permissions on /dev/kvm
if [ -e /dev/kvm ]; then
    sudo chmod 666 /dev/kvm
    echo "OK: /dev/kvm permissions set to 0666."
else
    echo "ERROR: /dev/kvm does not exist. Check kernel modules: sudo modprobe kvm kvm_intel"
fi

echo "=== Setup Complete! You can now run docker-compose up -d ==="
