import { Avatar as AntAvatar, Flex } from 'antd';

type AvatarProps = {
  fullName?: string;
  src?: string;
  alt?: string;
  size?: number | 'small' | 'default' | 'large';
};

const getInitials = (fullName: string) => {
  const names = fullName.split(' ');
  const initials = names.map((name) => name.charAt(0).toUpperCase());
  return initials.join('');
};

const getDeterministicColor = (input: string) => {
  let hash = 0;

  for (let i = 0; i < input.length; i++) {
    hash = input.charCodeAt(i) + ((hash << 5) - hash);
  }

  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 65%, 45%)`;
};

const Avatar = ({ fullName, src, alt, size }: AvatarProps) => {
  if (fullName && !src) {
    const initials = getInitials(fullName);
    return (
      <Flex
        align="center"
        gap="small"
        style={{ cursor: 'pointer' }}
      >
        <AntAvatar
          style={{ backgroundColor: getDeterministicColor(fullName) }}
          size={size}
        >
          {initials}
        </AntAvatar>
        {fullName ?? 'User'}
      </Flex>
    );
  }
  return <AntAvatar src={src} alt={alt} size={size} />;
};

export default Avatar;
