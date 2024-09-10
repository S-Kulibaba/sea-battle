import React, {useState} from "react";
import { useNavigate } from "react-router-dom";

const CreateGame = () => {

    const [copied, setCopied] = useState(false);

    const roomCode = useState([0, 0, 0, 0]);
    const navigate = useNavigate();

    const copyCode = () => {
        navigator.clipboard.writeText(roomCode).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    }

    const goBack = () => {
        navigate('/');
    };

    return (
        <div className="h-screen w-screen flex flex-col items-center justify-center">
        <h1 className="font-fo uppercase fw-400 text-4xl mb-[20px]">Sea Battle!</h1>
        <div className="w-[480px] h-[240px] border border-black rounded-[10px] flex justify-center relative">
          <div className="flex flex-col items-center justify-center">
          <i className="fa-solid fa-arrow-left fa-black fa-xl m-[20px] cursor-pointer absolute top-0 left-[10px]" onClick={goBack}></i>
            <div className="h-[90%] flex flex-col items-center justify-center relative">
                <h2 className="font-fo uppercase fw-400 text-xl">
                    Perfect! Your game is created!
                </h2>
                <div className="flex cursor-pointer" onClick={copyCode}>
                    <span className="font-fo uppercase fw-400 text-3xl mt-[40px] falling-number">
                        {roomCode}
                    </span>
                </div>
                {copied && <p className="text-green-500 font-fo absolute bottom-0">Copied!</p>}
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  export default CreateGame;
  