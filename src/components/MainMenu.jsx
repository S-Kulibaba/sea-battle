import { Link } from 'react-router-dom';

const MainMenu = () => {
  return (
    <div className="h-screen w-screen flex flex-col items-center justify-center">
      <h1 className="font-fo uppercase fw-400 text-4xl mb-[20px]">Sea Battle!</h1>
      <div className="w-[480px] h-[240px] border border-black rounded-[10px] flex justify-center relative">
        <div className="flex flex-col items-center justify-center">
            <div className="flex">
                <Link to="/create">
                    <button className="h-[47px] w-[117px] m-[10px] font-fo btn">Create Game</button>
                </Link>
                <Link to="/connect">
                    <button className="h-[47px] w-[117px] m-[10px] font-fo btn">Connect game</button>
                </Link>
            </div>
        </div>
      </div>
    </div>
  );
};

export default MainMenu;
