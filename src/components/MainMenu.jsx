import { Link } from 'react-router-dom';

const MainMenu = () => {
  return (
    <div>
      <h1>Морской Бой</h1>
      <Link to="/create">
        <button>Создать игру</button>
      </Link>
      <Link to="/connect">
        <button>Присоединиться к игре</button>
      </Link>
    </div>
  );
};

export default MainMenu;
