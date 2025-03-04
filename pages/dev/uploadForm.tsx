declare global {
  interface Window {
    showOpenFilePicker(): any;
  }
}

export default function UploadForm() {
  const getFileHandle = async () => {
    const [fileHandle] = await window.showOpenFilePicker();
    const file = await fileHandle.getFile();
    console.log(file);
    return file;
  };

  return (
    <div>
      <button onClick={getFileHandle}>Choose File</button>
    </div>
  );
}
